import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const single = vi.fn();
const select = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select }));
const from = vi.fn(() => ({ insert }));
const parse = vi.fn();

vi.mock("@/lib/supabase-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-auth")>();
  return {
    ...actual,
    createServerSupabaseClient: async () => ({
      auth: { getUser },
      from,
    }),
  };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse };
  },
}));

const { POST } = await import("@/app/api/listings/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/listings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function mockPhotoFetch() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    }),
  );
}

describe("POST /api/listings", () => {
  beforeEach(() => {
    getUser.mockReset();
    single.mockReset();
    select.mockClear();
    insert.mockClear();
    from.mockClear();
    parse.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      makeRequest({ name: "Eggs", lat: 1, lng: 2 }),
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a request missing lat/lng", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest({ name: "Eggs" }));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("writes the listing with owner_id set and returns 201", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    single.mockResolvedValue({
      data: { id: "listing-1", owner_id: "user-1", name: "Eggs" },
      error: null,
    });

    const response = await POST(
      makeRequest({ name: "Eggs", description: "half a dozen", lat: 1, lng: 2 }),
    );

    expect(response.status).toBe(201);
    expect(from).toHaveBeenCalledWith("listings");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: "user-1",
        name: "Eggs",
        status: "available",
        recommend_score: null,
        recommend_reason: null,
      }),
    );
    expect(parse).not.toHaveBeenCalled();
  });

  it("rejects an invalid category", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(
      makeRequest({ name: "Eggs", category: "Not a real category", lat: 1, lng: 2 }),
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("stores a valid category", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    single.mockResolvedValue({
      data: { id: "listing-1", owner_id: "user-1", name: "Kimchi", category: "Korean" },
      error: null,
    });

    const response = await POST(
      makeRequest({ name: "Kimchi", category: "Korean", lat: 1, lng: 2 }),
    );

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Korean" }),
    );
  });

  it("blocks a flagged photo without writing a listing", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockPhotoFetch();
    parse.mockResolvedValue({
      parsed_output: {
        safe: false,
        safetyReason: "Visible mold on the bread",
        recommendScore: 0,
        scoreReason: "n/a",
      },
    });

    const response = await POST(
      makeRequest({
        name: "Bread",
        photoUrl: "https://storage.example/bread.jpg",
        lat: 1,
        lng: 2,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Visible mold on the bread");
    expect(from).not.toHaveBeenCalled();
  });

  it("stores the recommend score for a safe photo", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockPhotoFetch();
    parse.mockResolvedValue({
      parsed_output: {
        safe: true,
        safetyReason: null,
        recommendScore: 8,
        scoreReason: "Looks fresh and well described",
      },
    });
    single.mockResolvedValue({
      data: { id: "listing-1", owner_id: "user-1", name: "Kimchi", recommend_score: 8 },
      error: null,
    });

    const response = await POST(
      makeRequest({
        name: "Kimchi",
        description: "Fresh batch, made yesterday",
        photoUrl: "https://storage.example/kimchi.jpg",
        lat: 1,
        lng: 2,
      }),
    );

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        recommend_score: 8,
        recommend_reason: "Looks fresh and well described",
      }),
    );
  });

  it("returns a clean error when the Anthropic call fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockPhotoFetch();
    parse.mockRejectedValue(new Error("network error"));

    const response = await POST(
      makeRequest({
        name: "Kimchi",
        photoUrl: "https://storage.example/kimchi.jpg",
        lat: 1,
        lng: 2,
      }),
    );

    expect(response.status).toBe(502);
    expect(from).not.toHaveBeenCalled();
  });
});

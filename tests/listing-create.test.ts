import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const single = vi.fn();
const select = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select }));
const from = vi.fn(() => ({ insert }));

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

const { POST } = await import("@/app/api/listings/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/listings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/listings", () => {
  beforeEach(() => {
    getUser.mockReset();
    single.mockReset();
    select.mockClear();
    insert.mockClear();
    from.mockClear();
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
      expect.objectContaining({ owner_id: "user-1", name: "Eggs", status: "available" }),
    );
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
});

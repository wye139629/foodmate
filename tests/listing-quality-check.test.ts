import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const parse = vi.fn();

vi.mock("@/lib/supabase-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-auth")>();
  return {
    ...actual,
    createServerSupabaseClient: async () => ({ auth: { getUser } }),
  };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse };
  },
}));

const { POST } = await import("@/app/api/listings/check-photo/route");

function makeRequest(formData: FormData) {
  return new Request("http://localhost/api/listings/check-photo", {
    method: "POST",
    body: formData,
  });
}

function photoFormData(type = "image/jpeg") {
  const formData = new FormData();
  formData.append(
    "photo",
    new File([new Uint8Array([1, 2, 3])], "food.jpg", { type }),
  );
  return formData;
}

describe("POST /api/listings/check-photo", () => {
  beforeEach(() => {
    getUser.mockReset();
    parse.mockReset();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(makeRequest(photoFormData()));

    expect(response.status).toBe(401);
    expect(parse).not.toHaveBeenCalled();
  });

  it("rejects a request with no photo", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest(new FormData()));

    expect(response.status).toBe(400);
    expect(parse).not.toHaveBeenCalled();
  });

  it("rejects an unsupported photo format", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest(photoFormData("image/heic")));

    expect(response.status).toBe(400);
    expect(parse).not.toHaveBeenCalled();
  });

  it("passes a clean photo", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    parse.mockResolvedValue({
      parsed_output: { safe: true, reason: null },
    });

    const response = await POST(makeRequest(photoFormData()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.safe).toBe(true);
  });

  it("blocks a flagged photo with a reason", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    parse.mockResolvedValue({
      parsed_output: { safe: false, reason: "Visible mold on the bread" },
    });

    const response = await POST(makeRequest(photoFormData()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.safe).toBe(false);
    expect(body.reason).toBe("Visible mold on the bread");
  });

  it("returns a clean error when the Anthropic call fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    parse.mockRejectedValue(new Error("network error"));

    const response = await POST(makeRequest(photoFormData()));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toMatch(/could not check/i);
  });
});

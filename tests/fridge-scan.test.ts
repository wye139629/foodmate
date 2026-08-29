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

const { POST } = await import("@/app/api/listings/scan/route");

function makeRequest(formData: FormData) {
  return new Request("http://localhost/api/listings/scan", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/listings/scan", () => {
  beforeEach(() => {
    getUser.mockReset();
    parse.mockReset();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(makeRequest(new FormData()));

    expect(response.status).toBe(401);
    expect(parse).not.toHaveBeenCalled();
  });

  it("rejects a request with no photo", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest(new FormData()));

    expect(response.status).toBe(400);
    expect(parse).not.toHaveBeenCalled();
  });

  it("returns the parsed item list from Claude", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    parse.mockResolvedValue({
      parsed_output: {
        items: [{ name: "Eggs", description: "3 left" }],
      },
    });

    const formData = new FormData();
    formData.append(
      "photo",
      new File([new Uint8Array([1, 2, 3])], "fridge.jpg", {
        type: "image/jpeg",
      }),
    );

    const response = await POST(makeRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([{ name: "Eggs", description: "3 left" }]);
    expect(parse).toHaveBeenCalledOnce();
  });
});

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

const { POST } = await import("@/app/api/requests/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/requests", () => {
  beforeEach(() => {
    getUser.mockReset();
    single.mockReset();
    select.mockClear();
    insert.mockClear();
    from.mockClear();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(makeRequest({ itemName: "Eggs" }));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a request missing itemName", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a blank itemName", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest({ itemName: "   " }));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("writes the request with requester_id set and returns 201", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    single.mockResolvedValue({
      data: { id: "request-1", requester_id: "user-1", item_name: "Eggs" },
      error: null,
    });

    const response = await POST(makeRequest({ itemName: "Eggs" }));

    expect(response.status).toBe(201);
    expect(from).toHaveBeenCalledWith("requests");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ requester_id: "user-1", item_name: "Eggs" }),
    );
  });
});

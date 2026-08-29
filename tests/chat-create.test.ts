import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const maybeSingle = vi.fn();
const limit = vi.fn(() => ({ maybeSingle }));
const or = vi.fn(() => ({ limit }));
const select = vi.fn(() => ({ or }));

const insertSingle = vi.fn();
const insertSelect = vi.fn(() => ({ single: insertSingle }));
const insert = vi.fn(() => ({ select: insertSelect }));

const from = vi.fn(() => ({ select, insert }));

vi.mock("@/lib/supabase-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-auth")>();
  return {
    ...actual,
    createServerSupabaseClient: async () => ({ auth: { getUser }, from }),
  };
});

const { POST } = await import("@/app/api/chat/open/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat/open", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat/open", () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
    insertSingle.mockReset();
    limit.mockClear();
    or.mockClear();
    select.mockClear();
    insert.mockClear();
    insertSelect.mockClear();
    from.mockClear();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(makeRequest({ otherUserId: "owner-1" }));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a request missing otherUserId", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects starting a chat with yourself", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest({ otherUserId: "user-1" }));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("reopens an existing chat instead of creating a duplicate", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({
      data: { id: "chat-1", user_id_1: "user-1", user_id_2: "owner-1" },
      error: null,
    });

    const response = await POST(makeRequest({ otherUserId: "owner-1" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.chat.id).toBe("chat-1");
    expect(insert).not.toHaveBeenCalled();
  });

  it("creates a new chat when none exists yet", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    insertSingle.mockResolvedValue({
      data: { id: "chat-2", user_id_1: "user-1", user_id_2: "owner-1" },
      error: null,
    });

    const response = await POST(makeRequest({ otherUserId: "owner-1" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.chat.id).toBe("chat-2");
    expect(insert).toHaveBeenCalledWith({
      user_id_1: "user-1",
      user_id_2: "owner-1",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const maybeSingle = vi.fn();
const limit = vi.fn(() => ({ maybeSingle }));
const or = vi.fn(() => ({ limit }));
const select = vi.fn(() => ({ or }));

const insertSingle = vi.fn();
const insertSelect = vi.fn(() => ({ single: insertSingle }));
const insert = vi.fn(() => ({ select: insertSelect }));

const updateSingle = vi.fn();
const updateSelect = vi.fn(() => ({ single: updateSingle }));
const updateEq = vi.fn(() => ({ select: updateSelect }));
const update = vi.fn(() => ({ eq: updateEq }));

const from = vi.fn(() => ({ select, insert, update }));

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
    updateSingle.mockReset();
    limit.mockClear();
    or.mockClear();
    select.mockClear();
    insert.mockClear();
    insertSelect.mockClear();
    update.mockClear();
    updateEq.mockClear();
    updateSelect.mockClear();
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

  it("backfills listing_id onto an existing chat that started without one", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({
      data: { id: "chat-1", user_id_1: "user-1", user_id_2: "owner-1", listing_id: null },
      error: null,
    });
    updateSingle.mockResolvedValue({
      data: { id: "chat-1", user_id_1: "user-1", user_id_2: "owner-1", listing_id: "listing-1" },
      error: null,
    });

    const response = await POST(
      makeRequest({ otherUserId: "owner-1", listingId: "listing-1" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ listing_id: "listing-1" });
    expect(body.chat.listing_id).toBe("listing-1");
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
      listing_id: null,
    });
  });

  it("stores the listing that started the chat", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    insertSingle.mockResolvedValue({
      data: { id: "chat-3", user_id_1: "user-1", user_id_2: "owner-1", listing_id: "listing-1" },
      error: null,
    });

    const response = await POST(
      makeRequest({ otherUserId: "owner-1", listingId: "listing-1" }),
    );

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith({
      user_id_1: "user-1",
      user_id_2: "owner-1",
      listing_id: "listing-1",
    });
  });

  it("recovers from a concurrent duplicate insert by refetching the winner", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { id: "chat-1", user_id_1: "owner-1", user_id_2: "user-1" },
        error: null,
      });
    insertSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });

    const response = await POST(makeRequest({ otherUserId: "owner-1" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.chat.id).toBe("chat-1");
  });
});

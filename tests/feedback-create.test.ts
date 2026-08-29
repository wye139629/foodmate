import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

// Context lookup: from("chats" | "listings").select(...).eq("id", x).maybeSingle()
const lookupMaybeSingle = vi.fn();
const lookupEq = vi.fn(() => ({ maybeSingle: lookupMaybeSingle }));
const lookupSelect = vi.fn(() => ({ eq: lookupEq }));

// Insert: from("feedback").insert({...}).select().single()
const insertSingle = vi.fn();
const insertSelect = vi.fn(() => ({ single: insertSingle }));
const insert = vi.fn(() => ({ select: insertSelect }));

const from = vi.fn((table: string) =>
  table === "feedback" ? { insert } : { select: lookupSelect },
);

vi.mock("@/lib/supabase-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-auth")>();
  return {
    ...actual,
    createServerSupabaseClient: async () => ({ auth: { getUser }, from }),
  };
});

const { POST } = await import("@/app/api/feedback/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    getUser.mockReset();
    lookupMaybeSingle.mockReset();
    insertSingle.mockReset();
    lookupEq.mockClear();
    lookupSelect.mockClear();
    insertSelect.mockClear();
    insert.mockClear();
    from.mockClear();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      makeRequest({ chatId: "chat-1", tags: ["Friendly"] }),
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a request with neither chatId nor listingId", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest({ tags: ["Friendly"] }));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a request with both chatId and listingId", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(
      makeRequest({
        chatId: "chat-1",
        listingId: "listing-1",
        tags: ["Friendly"],
      }),
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a request with no tags", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(makeRequest({ chatId: "chat-1", tags: [] }));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects more than three tags", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(
      makeRequest({
        chatId: "chat-1",
        tags: ["Friendly", "Helpful", "On time", "Thoughtful"],
      }),
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a tag that is not on the canonical list", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(
      makeRequest({ chatId: "chat-1", tags: ["Rude"] }),
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a note longer than the limit", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(
      makeRequest({
        chatId: "chat-1",
        tags: ["Friendly"],
        note: "x".repeat(281),
      }),
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns 404 when the chat does not exist", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    lookupMaybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await POST(
      makeRequest({ chatId: "chat-x", tags: ["Friendly"] }),
    );

    expect(response.status).toBe(404);
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns 403 when the author is not part of the chat", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    lookupMaybeSingle.mockResolvedValue({
      data: { user_id_1: "user-2", user_id_2: "user-3" },
      error: null,
    });

    const response = await POST(
      makeRequest({ chatId: "chat-1", tags: ["Friendly"] }),
    );

    expect(response.status).toBe(403);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects feedback on the author's own listing", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    lookupMaybeSingle.mockResolvedValue({
      data: { owner_id: "user-1" },
      error: null,
    });

    const response = await POST(
      makeRequest({ listingId: "listing-1", tags: ["Friendly"] }),
    );

    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("writes feedback from a chat with both user ids set and returns 201", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    lookupMaybeSingle.mockResolvedValue({
      data: { user_id_1: "user-1", user_id_2: "user-2" },
      error: null,
    });
    insertSingle.mockResolvedValue({
      data: { id: "fb-1", from_user_id: "user-1", to_user_id: "user-2" },
      error: null,
    });

    const response = await POST(
      makeRequest({
        chatId: "chat-1",
        tags: ["Friendly", "On time"],
        note: "  Lovely sourdough  ",
      }),
    );

    expect(response.status).toBe(201);
    expect(from).toHaveBeenCalledWith("feedback");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        from_user_id: "user-1",
        to_user_id: "user-2",
        chat_id: "chat-1",
        listing_id: null,
        tags: ["Friendly", "On time"],
        note: "Lovely sourdough",
      }),
    );
  });

  it("writes feedback from a listing, addressed to the owner", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    lookupMaybeSingle.mockResolvedValue({
      data: { owner_id: "owner-9" },
      error: null,
    });
    insertSingle.mockResolvedValue({ data: { id: "fb-2" }, error: null });

    const response = await POST(
      makeRequest({ listingId: "listing-1", tags: ["Helpful"] }),
    );

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        from_user_id: "user-1",
        to_user_id: "owner-9",
        listing_id: "listing-1",
        chat_id: null,
        tags: ["Helpful"],
        note: null,
      }),
    );
  });

  it("maps a duplicate-submission conflict to 409", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    lookupMaybeSingle.mockResolvedValue({
      data: { user_id_1: "user-1", user_id_2: "user-2" },
      error: null,
    });
    insertSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });

    const response = await POST(
      makeRequest({ chatId: "chat-1", tags: ["Friendly"] }),
    );

    expect(response.status).toBe(409);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

// Lookup: from("listings").select("owner_id").eq("id", id).maybeSingle()
const maybeSingle = vi.fn();
const selectEq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq: selectEq }));

// Update: from("listings").update({...}).eq("id", id).select().single()
const single = vi.fn();
const updateSelect = vi.fn(() => ({ single }));
const updateEq = vi.fn(() => ({ select: updateSelect }));
const update = vi.fn(() => ({ eq: updateEq }));

const from = vi.fn(() => ({ select, update }));

vi.mock("@/lib/supabase-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-auth")>();
  return {
    ...actual,
    createServerSupabaseClient: async () => ({ auth: { getUser }, from }),
  };
});

const { PATCH } = await import("@/app/api/listings/[id]/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/listings/listing-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const ctx = (id = "listing-1") => ({ params: Promise.resolve({ id }) });

describe("PATCH /api/listings/[id]", () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
    single.mockReset();
    selectEq.mockClear();
    select.mockClear();
    updateSelect.mockClear();
    updateEq.mockClear();
    update.mockClear();
    from.mockClear();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const res = await PATCH(makeRequest({ status: "taken" }), ctx());

    expect(res.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a status other than available/taken", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const res = await PATCH(makeRequest({ status: "complete" }), ctx());

    expect(res.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns 404 when the listing does not exist", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const res = await PATCH(makeRequest({ status: "taken" }), ctx());

    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a caller who is not the owner", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({ data: { owner_id: "user-2" }, error: null });

    const res = await PATCH(makeRequest({ status: "taken" }), ctx());

    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("marks the owner's own listing taken", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({ data: { owner_id: "user-1" }, error: null });
    single.mockResolvedValue({
      data: { id: "listing-1", status: "taken" },
      error: null,
    });

    const res = await PATCH(makeRequest({ status: "taken" }), ctx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: "taken" });
    expect(body.listing.status).toBe("taken");
  });

  it("toggles the listing back to available", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({ data: { owner_id: "user-1" }, error: null });
    single.mockResolvedValue({
      data: { id: "listing-1", status: "available" },
      error: null,
    });

    const res = await PATCH(makeRequest({ status: "available" }), ctx());

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: "available" });
  });
});

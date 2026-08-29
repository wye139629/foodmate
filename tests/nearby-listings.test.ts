import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const eq = vi.fn();
const neq = vi.fn();
const gte = vi.fn();
const select = vi.fn();
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-auth")>();
  return {
    ...actual,
    createServerSupabaseClient: async () => ({ auth: { getUser }, from }),
  };
});

const { GET } = await import("@/app/api/listings/nearby/route");

// Center at the equator/prime meridian so 1 degree of lat ~= 111.19km,
// with no longitude scaling to worry about.
const CENTER_LAT = 0;
const CENTER_LNG = 0;
const NEAR = { id: "near", lat: 0.05, lng: 0, name: "Near", category: "Korean" }; // ~5.6km
const MID = { id: "mid", lat: 0.2, lng: 0, name: "Mid", category: "Italian" }; // ~22.2km
const FAR = { id: "far", lat: 1.0, lng: 0, name: "Far", category: null }; // ~111km

// The route chains .neq()/.gte()/.eq() then awaits the query builder itself
// (matching supabase-js's thenable query builder).
function setupQuery(data: unknown[]) {
  const builder = {
    eq,
    neq,
    gte,
    then: (resolve: (value: { data: unknown; error: null }) => void) =>
      resolve({ data, error: null }),
  };
  eq.mockReturnValue(builder);
  neq.mockReturnValue(builder);
  gte.mockReturnValue(builder);
  select.mockReturnValue(builder);
}

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/listings/nearby");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url);
}

describe("GET /api/listings/nearby", () => {
  beforeEach(() => {
    getUser.mockReset();
    eq.mockReset();
    neq.mockReset();
    gte.mockReset();
    select.mockReset();
    from.mockClear();
  });

  it("rejects an unauthenticated request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await GET(
      makeRequest({ lat: String(CENTER_LAT), lng: String(CENTER_LNG) }),
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a request missing lat/lng", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await GET(makeRequest({}));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects an invalid category", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await GET(
      makeRequest({
        lat: String(CENTER_LAT),
        lng: String(CENTER_LNG),
        category: "Not a real category",
      }),
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("applies the default 10km radius when none is given", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupQuery([NEAR, MID, FAR]);

    const response = await GET(
      makeRequest({ lat: String(CENTER_LAT), lng: String(CENTER_LNG) }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.radiusKm).toBe(10);
    expect(body.listings.map((l: { id: string }) => l.id)).toEqual(["near"]);
  });

  it("includes items within a wider custom radius, sorted by distance", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupQuery([FAR, NEAR, MID]);

    const response = await GET(
      makeRequest({
        lat: String(CENTER_LAT),
        lng: String(CENTER_LNG),
        radiusKm: "25",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.listings.map((l: { id: string }) => l.id)).toEqual([
      "near",
      "mid",
    ]);
  });

  it("excludes completed listings and applies the 48h active-window cutoff", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupQuery([]);

    await GET(makeRequest({ lat: String(CENTER_LAT), lng: String(CENTER_LNG) }));

    expect(select).toHaveBeenCalledWith("*");
    expect(neq).toHaveBeenCalledWith("status", "complete");
    expect(gte).toHaveBeenCalledWith("created_at", expect.any(String));
  });

  it("filters by category when one is given", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupQuery([NEAR, MID]);

    const response = await GET(
      makeRequest({
        lat: String(CENTER_LAT),
        lng: String(CENTER_LNG),
        radiusKm: "25",
        category: "Korean",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith("category", "Korean");
    // The mock returns both regardless of category (it doesn't actually
    // filter server-side in the mock) - this test only verifies the route
    // asks Supabase to filter by category, not the DB's own filtering.
    expect(body.listings.map((l: { id: string }) => l.id).sort()).toEqual([
      "mid",
      "near",
    ]);
  });

  it("does not filter by category when none is given", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupQuery([NEAR]);

    await GET(makeRequest({ lat: String(CENTER_LAT), lng: String(CENTER_LNG) }));

    expect(eq).not.toHaveBeenCalledWith("category", expect.anything());
  });
});

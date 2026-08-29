import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const eq = vi.fn();
const select = vi.fn(() => ({ eq }));
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
const NEAR = { id: "near", lat: 0.05, lng: 0, name: "Near" }; // ~5.6km
const MID = { id: "mid", lat: 0.2, lng: 0, name: "Mid" }; // ~22.2km
const FAR = { id: "far", lat: 1.0, lng: 0, name: "Far" }; // ~111km

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
    select.mockClear();
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

  it("applies the default 10km radius when none is given", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    eq.mockResolvedValue({ data: [NEAR, MID, FAR], error: null });

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
    eq.mockResolvedValue({ data: [FAR, NEAR, MID], error: null });

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

  it("only queries available listings", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    eq.mockResolvedValue({ data: [], error: null });

    await GET(makeRequest({ lat: String(CENTER_LAT), lng: String(CENTER_LNG) }));

    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("status", "available");
  });
});

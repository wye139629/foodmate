import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { haversineDistanceKm } from "@/lib/geo-distance";
import { isListingCategory } from "@/lib/listing-categories";
import { listingActiveCutoffIso } from "@/lib/listing-status";

const DEFAULT_RADIUS_KM = 10;

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const radiusKm = searchParams.has("radiusKm")
    ? Number(searchParams.get("radiusKm"))
    : DEFAULT_RADIUS_KM;

  if (!latParam || !lngParam) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 },
    );
  }

  const lat = Number(latParam);
  const lng = Number(lngParam);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng must be numbers" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    return NextResponse.json(
      { error: "radiusKm must be a positive number" },
      { status: 400 },
    );
  }

  const categoryParam = searchParams.get("category");
  if (categoryParam !== null && !isListingCategory(categoryParam)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Show "available" and "taken" listings from the last 48h (FR-009 auto-delist).
  // "taken" still renders on the map with a badge so a requester can see it was
  // claimed rather than wondering where it went. "complete" is excluded.
  let query = supabase
    .from("listings")
    .select("*")
    .neq("status", "complete")
    .gte("created_at", listingActiveCutoffIso());
  if (categoryParam !== null) {
    query = query.eq("category", categoryParam);
  }
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings = (data ?? [])
    .map((listing) => ({
      ...listing,
      distanceKm: haversineDistanceKm(lat, lng, listing.lat, listing.lng),
    }))
    .filter((listing) => listing.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return NextResponse.json({ listings, radiusKm });
}

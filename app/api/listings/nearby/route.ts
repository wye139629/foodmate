import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { haversineDistanceKm } from "@/lib/geo-distance";

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

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "available");

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

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { isListingCategory } from "@/lib/listing-categories";

interface CreateListingBody {
  name?: string;
  description?: string;
  photoUrl?: string;
  category?: string;
  lat?: number;
  lng?: number;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as CreateListingBody;
  const { name, description, photoUrl, category, lat, lng } = body;

  if (!name || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "name, lat, and lng are required" },
      { status: 400 },
    );
  }

  if (category !== undefined && !isListingCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      name,
      description: description ?? null,
      photo_url: photoUrl ?? null,
      category: category ?? null,
      lat,
      lng,
      status: "available",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing: data }, { status: 201 });
}

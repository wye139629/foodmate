import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { isOwnerTogglableStatus } from "@/lib/listing-status";

interface UpdateListingBody {
  status?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as UpdateListingBody;
  if (!isOwnerTogglableStatus(body.status)) {
    return NextResponse.json(
      { error: "status must be 'available' or 'taken'" },
      { status: 400 },
    );
  }

  const { data: listing, error: findError } = await supabase
    .from("listings")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the owner can change this listing" },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .update({ status: body.status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing: data });
}

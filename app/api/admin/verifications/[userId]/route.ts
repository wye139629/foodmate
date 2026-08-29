import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";

interface DecisionBody {
  decision?: "verified" | "rejected";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { decision } = (await request.json()) as DecisionBody;
  if (decision !== "verified" && decision !== "rejected") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const { userId } = await params;
  const admin = createAdminSupabaseClient();

  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("verification_photo_path")
    .eq("id", userId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }

  if (profile.verification_photo_path) {
    await admin.storage
      .from("student-ids")
      .remove([profile.verification_photo_path]);
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ verification_status: decision, verification_photo_path: null })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

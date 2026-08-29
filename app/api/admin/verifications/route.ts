import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";
import { listPendingVerifications } from "@/lib/verification";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();

  try {
    const pending = await listPendingVerifications(admin);
    return NextResponse.json({ pending });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load reviews" },
      { status: 500 },
    );
  }
}

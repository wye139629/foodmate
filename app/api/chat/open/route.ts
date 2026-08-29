import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";

interface OpenChatBody {
  otherUserId?: string;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { otherUserId } = (await request.json()) as OpenChatBody;

  if (!otherUserId) {
    return NextResponse.json(
      { error: "otherUserId is required" },
      { status: 400 },
    );
  }

  if (otherUserId === user.id) {
    return NextResponse.json(
      { error: "Cannot start a chat with yourself" },
      { status: 400 },
    );
  }

  const { data: existing, error: findError } = await supabase
    .from("chats")
    .select("*")
    .or(
      `and(user_id_1.eq.${user.id},user_id_2.eq.${otherUserId}),and(user_id_1.eq.${otherUserId},user_id_2.eq.${user.id})`,
    )
    .limit(1)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ chat: existing });
  }

  const { data: created, error: createError } = await supabase
    .from("chats")
    .insert({ user_id_1: user.id, user_id_2: otherUserId })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ chat: created }, { status: 201 });
}

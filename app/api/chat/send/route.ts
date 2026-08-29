import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";

interface SendMessageBody {
  chatId?: string;
  content?: string;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { chatId, content } = (await request.json()) as SendMessageBody;

  if (!chatId || !content?.trim()) {
    return NextResponse.json(
      { error: "chatId and content are required" },
      { status: 400 },
    );
  }

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, user_id_1, user_id_2")
    .eq("id", chatId)
    .maybeSingle();

  if (chatError) {
    return NextResponse.json({ error: chatError.message }, { status: 500 });
  }

  if (!chat || (chat.user_id_1 !== user.id && chat.user_id_2 !== user.id)) {
    return NextResponse.json(
      { error: "Not a participant of this chat" },
      { status: 403 },
    );
  }

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: user.id, content: content.trim() })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ message }, { status: 201 });
}

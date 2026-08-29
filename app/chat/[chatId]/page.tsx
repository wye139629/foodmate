import ChatWindow from "@/components/ChatWindow";
import { createServerSupabaseClient } from "@/lib/supabase-auth";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  return (
    <main>
      <h1>Chat</h1>
      <p role="note">
        Meeting up? Choose a public place and confirm who you&apos;re meeting
        beforehand.
      </p>
      <ChatWindow
        chatId={chatId}
        currentUserId={user?.id ?? ""}
        initialMessages={messages ?? []}
      />
    </main>
  );
}

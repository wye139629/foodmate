import ChatWindow from "@/components/ChatWindow";
import BackButton from "@/components/BackButton";
import { createServerSupabaseClient } from "@/lib/supabase-auth";

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

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

  const [{ data: chat }, { data: messages }] = await Promise.all([
    supabase.from("chats").select("user_id_1, user_id_2").eq("id", chatId).single(),
    supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true }),
  ]);

  const otherUserId = chat
    ? chat.user_id_1 === user?.id
      ? chat.user_id_2
      : chat.user_id_1
    : null;

  const { data: otherProfile } = otherUserId
    ? await supabase.from("profiles").select("display_name").eq("id", otherUserId).single()
    : { data: null };

  const otherName = otherProfile?.display_name ?? "A neighbor";

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b-2 border-border bg-card px-4 py-3">
        <BackButton />
        <span className="flex size-9 items-center justify-center rounded-full border-2 border-border bg-primary/20 font-heading text-sm font-bold">
          {initialsFor(otherName)}
        </span>
        <h1 className="font-heading text-lg">{otherName}</h1>
      </header>

      <p className="shrink-0 border-b border-border/40 bg-muted px-4 py-2 text-center text-xs font-medium text-muted-foreground">
        Meeting up? Choose a public place and confirm who you&apos;re meeting
        beforehand.
      </p>

      <ChatWindow
        chatId={chatId}
        currentUserId={user?.id ?? ""}
        initialMessages={messages ?? []}
      />
    </div>
  );
}

import Link from "next/link";
import ChatWindow from "@/components/ChatWindow";
import BackButton from "@/components/BackButton";
import { createServerSupabaseClient } from "@/lib/supabase-auth";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const supabase = await createServerSupabaseClient();
  // Middleware already verified this request's JWT with a network round-trip
  // (auth.getUser()) before rendering started — getSession() just decodes the
  // already-verified cookie locally, no second round-trip.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  const [{ data: chat }, { data: messages }] = await Promise.all([
    supabase
      .from("chats")
      .select("user_id_1, user_id_2")
      .eq("id", chatId)
      .single(),
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
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", otherUserId)
        .single()
    : { data: null };

  const otherName = otherProfile?.display_name ?? "A neighbor";

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-background px-4 py-3">
        <BackButton />
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">
          {otherName}
        </h1>
        <Link
          href={`/feedback?chatId=${chatId}`}
          className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1.5 text-[12px] font-semibold"
        >
          Feedback
        </Link>
      </header>

      <div className="flex flex-col gap-3 px-4 pt-3">
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 size-4 shrink-0 text-accent"
          >
            <path d="M12 3.5 21 19H3L12 3.5Z" />
            <path d="M12 9.5v4.5" />
            <path d="M12 16.75h.01" />
          </svg>
          <div>
            <p className="text-sm font-semibold">Safety notice</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
              Always meet in a public place, and confirm who you&apos;re
              meeting beforehand.
            </p>
          </div>
        </div>
      </div>

      <ChatWindow
        chatId={chatId}
        currentUserId={user?.id ?? ""}
        initialMessages={messages ?? []}
      />
    </div>
  );
}

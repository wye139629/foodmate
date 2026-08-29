import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { timeAgo } from "@/lib/time-ago";
import BottomNav from "@/components/BottomNav";
import RatingBadge from "@/components/RatingBadge";

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default async function ChatListPage() {
  const supabase = await createServerSupabaseClient();
  // Middleware already verified this request's JWT with a network round-trip
  // (auth.getUser()) before rendering started — getSession() just decodes the
  // already-verified cookie locally, no second round-trip.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  const email = user?.email ?? "Guest";
  const initial = email.charAt(0).toUpperCase();

  const { data: chats } = await supabase
    .from("chats")
    .select("id, user_id_1, user_id_2, created_at")
    .or(`user_id_1.eq.${user?.id},user_id_2.eq.${user?.id}`);

  const chatIds = (chats ?? []).map((chat) => chat.id);
  const otherUserIds = (chats ?? []).map((chat) =>
    chat.user_id_1 === user?.id ? chat.user_id_2 : chat.user_id_1,
  );

  const [{ data: messages }, { data: profiles }] = await Promise.all([
    chatIds.length
      ? supabase
          .from("messages")
          .select("chat_id, content, created_at")
          .in("chat_id", chatIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    otherUserIds.length
      ? supabase
          .from("profiles")
          .select("id, display_name, rating")
          .in("id", otherUserIds)
      : Promise.resolve({ data: [] }),
  ]);

  const latestByChat = new Map<string, { content: string; created_at: string }>();
  for (const message of messages ?? []) {
    if (!latestByChat.has(message.chat_id)) {
      latestByChat.set(message.chat_id, message);
    }
  }

  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      { name: p.display_name as string, rating: p.rating as number | null },
    ]),
  );

  const rows = (chats ?? [])
    .map((chat) => {
      const otherUserId = chat.user_id_1 === user?.id ? chat.user_id_2 : chat.user_id_1;
      const latest = latestByChat.get(chat.id);
      const other = profileById.get(otherUserId);
      return {
        id: chat.id,
        otherName: other?.name ?? "A neighbor",
        otherRating: other?.rating ?? null,
        preview: latest?.content ?? "Say hello to get started.",
        timestamp: latest?.created_at ?? chat.created_at,
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pt-12 pb-24">
      <header className="flex items-center justify-between border-b-2 border-border pb-4">
        <h1 className="font-heading text-2xl">Chats</h1>
        <Link
          href="/profile"
          className="flex size-9 items-center justify-center rounded-full border-2 border-border bg-muted text-sm font-bold"
        >
          {initial}
        </Link>
      </header>

      {rows.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/chat/${row.id}`}
                className="flex items-center gap-3 rounded-lg border-2 border-border bg-card p-3 shadow-[2px_2px_0_var(--border)]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary/20 font-heading text-sm font-bold">
                  {initialsFor(row.otherName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-heading text-base">{row.otherName}</p>
                    <RatingBadge rating={row.otherRating} />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{row.preview}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {timeAgo(row.timestamp)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No conversations yet — contact a sharer from the map to start one.
        </p>
      )}

      <BottomNav unreadChats={0} />
    </main>
  );
}

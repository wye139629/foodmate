import Link from "next/link";
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
    supabase
      .from("chats")
      .select("user_id_1, user_id_2, listing_id")
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
    ? await supabase.from("profiles").select("display_name").eq("id", otherUserId).single()
    : { data: null };

  const otherName = otherProfile?.display_name ?? "A neighbor";

  const { data: listing } = chat?.listing_id
    ? await supabase
        .from("listings")
        .select("id, name, photo_url, status, category")
        .eq("id", chat.listing_id)
        .single()
    : { data: null };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-background px-4 py-3">
        <BackButton />
        <h1 className="text-lg font-semibold">{otherName}</h1>
      </header>

      <div className="flex flex-col gap-3 px-4 pt-3">
        {listing && (
          <Link
            href={`/listings/${listing.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {listing.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, not a static import
                <img
                  src={listing.photo_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-xs font-semibold">
                  {initialsFor(listing.name)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{listing.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-md border border-border px-2 py-0.5 text-[12px] font-medium">
                  {listing.status === "complete" ? "Shared" : "Available"}
                </span>
                {listing.category && (
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {listing.category}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}

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

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import BackButton from "@/components/BackButton";
import BottomNav from "@/components/BottomNav";
import FeedbackForm from "@/components/FeedbackForm";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ chatId?: string; listingId?: string }>;
}) {
  const { chatId, listingId } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let recipientId: string | null = null;
  let problem: string | null = null;

  if (chatId && listingId) {
    problem = "This feedback link is malformed.";
  } else if (chatId) {
    const { data: chat } = await supabase
      .from("chats")
      .select("user_id_1, user_id_2")
      .eq("id", chatId)
      .maybeSingle();
    if (!chat) {
      problem = "We couldn't find that conversation.";
    } else if (user.id !== chat.user_id_1 && user.id !== chat.user_id_2) {
      problem = "You can only leave feedback for your own shares.";
    } else {
      recipientId = chat.user_id_1 === user.id ? chat.user_id_2 : chat.user_id_1;
    }
  } else if (listingId) {
    const { data: listing } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing) {
      problem = "We couldn't find that listing.";
    } else if (listing.owner_id === user.id) {
      problem = "You can't leave feedback on your own listing.";
    } else {
      recipientId = listing.owner_id;
    }
  } else {
    problem = "There's nothing here to leave feedback for.";
  }

  let recipientName = "your neighbour";
  let alreadySent = false;

  if (recipientId) {
    const [{ data: profile }, { data: existing }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", recipientId)
        .maybeSingle(),
      supabase
        .from("feedback")
        .select("id")
        .eq("from_user_id", user.id)
        .eq(chatId ? "chat_id" : "listing_id", (chatId ?? listingId)!)
        .maybeSingle(),
    ]);
    recipientName = profile?.display_name ?? "your neighbour";
    alreadySent = Boolean(existing);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pt-4 pb-28">
      <div className="pb-6">
        <BackButton />
      </div>

      {problem ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">{problem}</p>
        </div>
      ) : (
        <FeedbackForm
          chatId={chatId}
          listingId={listingId}
          recipientName={recipientName}
          alreadySent={alreadySent}
        />
      )}

      <BottomNav />
    </main>
  );
}

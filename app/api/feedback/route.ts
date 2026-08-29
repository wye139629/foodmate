import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import {
  MAX_FEEDBACK_NOTE_LENGTH,
  MAX_FEEDBACK_STARS,
  MAX_FEEDBACK_TAGS,
  isFeedbackStars,
  isFeedbackTag,
} from "@/lib/feedback-tags";

interface CreateFeedbackBody {
  chatId?: unknown;
  listingId?: unknown;
  tags?: unknown;
  note?: unknown;
  stars?: unknown;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as CreateFeedbackBody;
  const chatId = typeof body.chatId === "string" ? body.chatId : undefined;
  const listingId =
    typeof body.listingId === "string" ? body.listingId : undefined;

  // Exactly one context: feedback is about one share, reached either from the
  // chat or from the listing detail page.
  if ((chatId && listingId) || (!chatId && !listingId)) {
    return NextResponse.json(
      { error: "Provide exactly one of chatId or listingId" },
      { status: 400 },
    );
  }

  // Tags are optional - a feedback row can be just a star rating.
  const rawTags = body.tags == null ? [] : body.tags;
  if (!Array.isArray(rawTags)) {
    return NextResponse.json({ error: "tags must be an array" }, { status: 400 });
  }

  if (rawTags.length > MAX_FEEDBACK_TAGS) {
    return NextResponse.json(
      { error: `Pick up to ${MAX_FEEDBACK_TAGS} things` },
      { status: 400 },
    );
  }

  const uniqueTags = [...new Set(rawTags)];
  if (uniqueTags.length !== rawTags.length || !uniqueTags.every(isFeedbackTag)) {
    return NextResponse.json({ error: "Invalid feedback tag" }, { status: 400 });
  }

  let note: string | null = null;
  if (body.note != null) {
    if (typeof body.note !== "string") {
      return NextResponse.json({ error: "Invalid note" }, { status: 400 });
    }
    const trimmed = body.note.trim();
    if (trimmed.length > MAX_FEEDBACK_NOTE_LENGTH) {
      return NextResponse.json(
        { error: `Keep the note under ${MAX_FEEDBACK_NOTE_LENGTH} characters` },
        { status: 400 },
      );
    }
    note = trimmed || null;
  }

  if (!isFeedbackStars(body.stars) || body.stars < 1) {
    return NextResponse.json(
      { error: `Pick a star rating from 1 to ${MAX_FEEDBACK_STARS}` },
      { status: 400 },
    );
  }
  const stars = body.stars;

  let toUserId: string;

  if (chatId) {
    const { data: chat, error } = await supabase
      .from("chats")
      .select("user_id_1, user_id_2")
      .eq("id", chatId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    if (user.id !== chat.user_id_1 && user.id !== chat.user_id_2) {
      return NextResponse.json(
        { error: "You are not part of this chat" },
        { status: 403 },
      );
    }
    toUserId = chat.user_id_1 === user.id ? chat.user_id_2 : chat.user_id_1;
  } else {
    const { data: listing, error } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listingId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.owner_id === user.id) {
      return NextResponse.json(
        { error: "You can't leave feedback on your own listing" },
        { status: 400 },
      );
    }
    toUserId = listing.owner_id;
  }

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      chat_id: chatId ?? null,
      listing_id: listingId ?? null,
      tags: uniqueTags,
      note,
      stars,
    })
    .select()
    .single();

  if (error) {
    // The per-author-per-context unique index rejects a second submission.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already left feedback for this share" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feedback: data }, { status: 201 });
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase-auth";
import { timeAgo } from "@/lib/time-ago";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  initialMessages?: Message[];
}

export default function ChatWindow({
  chatId,
  currentUserId,
  initialMessages = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // The realtime socket needs the current session's JWT explicitly -
    // @supabase/ssr's cookie-based session isn't picked up by the realtime
    // client automatically, so subscribing without this silently receives
    // no events (RLS evaluates the connection as anonymous).
    supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`chat-${chatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          (payload: { new: Message }) => {
            setMessages((current) => [...current, payload.new]);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    // jsdom (tests) doesn't implement scrollIntoView at all.
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setError(null);

    const response = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, content }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not send message");
      return;
    }

    setContent("");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No messages yet — say hello!
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              return (
                <li
                  key={message.id}
                  className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl border-2 border-border px-4 py-2 text-sm font-medium shadow-[2px_2px_0_var(--border)]",
                      isOwn
                        ? "rounded-br-sm bg-accent text-accent-foreground"
                        : "rounded-bl-sm bg-card",
                    )}
                  >
                    <p>{message.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-[11px] font-normal",
                        isOwn
                          ? "text-accent-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {timeAgo(message.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="shrink-0 px-4 pb-1 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSend}
        className="flex shrink-0 items-center gap-2 border-t-2 border-border bg-card p-3"
      >
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message"
          className="flex-1 rounded-full border-2 border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary text-primary-foreground shadow-[2px_2px_0_var(--border)] disabled:opacity-50"
        >
          <ArrowUp className="size-5" />
        </button>
      </form>
    </div>
  );
}

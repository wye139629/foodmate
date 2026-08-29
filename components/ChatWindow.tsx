"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-auth";

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
    <div>
      <ul>
        {messages.map((message) => (
          <li key={message.id}>
            <strong>{message.sender_id === currentUserId ? "You" : "Them"}:</strong>{" "}
            {message.content}
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={handleSend}>
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

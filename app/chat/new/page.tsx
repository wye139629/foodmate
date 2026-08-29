"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function NewChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get("ownerId");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!otherUserId) return;

    fetch("/api/chat/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not open chat");
        }
        return response.json();
      })
      .then((body: { chat: { id: string } }) => {
        router.replace(`/chat/${body.chat.id}`);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Something went wrong");
      });
  }, [otherUserId, router]);

  return (
    <main>
      <h1>Contacting the sharer…</h1>
      {(error || !otherUserId) && (
        <p role="alert">{error ?? "Missing ownerId"}</p>
      )}
    </main>
  );
}

export default function NewChatPage() {
  return (
    <Suspense fallback={<main>Loading…</main>}>
      <NewChatContent />
    </Suspense>
  );
}

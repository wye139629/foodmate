"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FEEDBACK_TAGS,
  MAX_FEEDBACK_NOTE_LENGTH,
  MAX_FEEDBACK_STARS,
  MAX_FEEDBACK_TAGS,
} from "@/lib/feedback-tags";

const STAR_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
];

interface FeedbackFormProps {
  chatId?: string;
  listingId?: string;
  recipientName: string;
  alreadySent?: boolean;
}

export default function FeedbackForm({
  chatId,
  listingId,
  recipientName,
  alreadySent = false,
}: FeedbackFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [stars, setStars] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">(
    alreadySent ? "sent" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const atLimit = selected.length >= MAX_FEEDBACK_TAGS;
  const firstName = recipientName.split(" ")[0];

  function toggle(tag: string) {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((entry) => entry !== tag);
      if (prev.length >= MAX_FEEDBACK_TAGS) return prev;
      return [...prev, tag];
    });
  }

  const canSend = stars > 0;

  async function handleSubmit() {
    if (!canSend || status === "sending") return;
    setStatus("sending");
    setError(null);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        listingId,
        tags: selected,
        note: note.trim() || undefined,
        stars,
      }),
    });

    if (!response.ok) {
      // Already submitted (e.g. another tab, or a stale page) is a success
      // from the user's point of view - land them on the thank-you state.
      if (response.status === 409) {
        setStatus("sent");
        return;
      }
      const failure = await response.json().catch(() => ({}));
      setError(failure.error ?? "Could not send feedback");
      setStatus("idle");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full border-2 border-border bg-primary/20 shadow-[3px_3px_0_var(--border)]">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <h2 className="font-heading text-2xl">Thanks for the feedback</h2>
        <p className="max-w-[280px] text-sm font-medium text-muted-foreground">
          It helps keep FoodMate kind. {firstName} won&apos;t see exactly what
          you picked.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/board")}
          className="mt-2 h-11 px-6 text-sm font-semibold"
        >
          Back to shares
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-heading text-2xl leading-[1.2] font-bold">
        How did your share go?
      </h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        Choose up to 3 things that stood out (optional).
      </p>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {FEEDBACK_TAGS.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isSelected}
              disabled={!isSelected && atLimit}
              onClick={() => toggle(tag)}
              className={cn(
                "rounded-full border-2 border-border px-4 py-2 text-sm font-bold transition-all",
                isSelected
                  ? "bg-accent text-accent-foreground shadow-[2px_2px_0_var(--border)]"
                  : "bg-card hover:bg-muted",
                !isSelected && atLimit && "opacity-40",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <p className="font-heading text-lg font-bold">
          How many stars for {firstName}?
        </p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Tap a star.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {STAR_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((value) => {
                const filled = value <= stars;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} of ${MAX_FEEDBACK_STARS} stars`}
                    aria-pressed={filled}
                    onClick={() => setStars(stars === value ? 0 : value)}
                    className="rounded-md p-1 transition-transform active:scale-95"
                  >
                    <Star
                      className={cn(
                        "size-8",
                        filled
                          ? "fill-accent text-accent"
                          : "fill-transparent text-border",
                      )}
                      strokeWidth={2}
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor="feedback-note" className="font-heading text-lg font-bold">
          Anything you&apos;d like to say?
        </label>
        <input
          id="feedback-note"
          type="text"
          value={note}
          maxLength={MAX_FEEDBACK_NOTE_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          placeholder="A short note (optional)…"
          className="mt-2 h-14 w-full rounded-lg border-2 border-border bg-card px-4 text-sm font-medium outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-auto pt-8">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend || status === "sending"}
          className="h-14 w-full text-base font-semibold"
        >
          {status === "sending" ? "Sending…" : "Send feedback"}
        </Button>
      </div>
    </div>
  );
}

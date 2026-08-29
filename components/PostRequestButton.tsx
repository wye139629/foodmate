"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function PostRequestButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!itemName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not post that request");
      }

      setItemName("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Post a request"
        className="flex size-8 items-center justify-center rounded-full border border-border bg-muted"
      >
        <Plus className="size-4" />
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <input
        autoFocus
        value={itemName}
        onChange={(event) => setItemName(event.target.value)}
        placeholder="What do you need?"
        className="h-8 w-36 rounded-full border border-border bg-card px-3 text-sm outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        aria-label="Submit request"
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted disabled:opacity-50"
      >
        <Plus className="size-4" />
      </button>
    </form>
  );
}

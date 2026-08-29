"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ListingStatusToggleProps {
  listingId: string;
  initialStatus: string;
  className?: string;
}

/**
 * Owner-only Available <-> Taken toggle for one listing. Optimistic, then
 * router.refresh() so server-rendered status labels elsewhere on the page
 * re-sync. Used on the board ("Your Shares") and the profile page.
 */
export default function ListingStatusToggle({
  listingId,
  initialStatus,
  className,
}: ListingStatusToggleProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTaken = status === "taken";

  async function toggle() {
    const previous = status;
    const next = isTaken ? "available" : "taken";

    setPending(true);
    setError(null);
    setStatus(next);

    const response = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    setPending(false);

    if (!response.ok) {
      setStatus(previous);
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not update the listing");
      return;
    }

    router.refresh();
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={isTaken}
        className={cn(
          "rounded-lg border-2 border-border px-3 py-2 text-sm font-bold shadow-[2px_2px_0_var(--border)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50",
          isTaken ? "bg-card" : "bg-accent text-accent-foreground",
        )}
      >
        {isTaken ? "Mark available" : "Mark taken"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

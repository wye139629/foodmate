"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OwnListing {
  id: string;
  name: string;
  photo_url: string | null;
  status: string;
  created_at: string;
}

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function YourShares({ listings }: { listings: OwnListing[] }) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(listings.map((listing) => [listing.id, listing.status])),
  );
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: string) {
    const current = statuses[id] ?? "available";
    const next = current === "taken" ? "available" : "taken";

    setPending(id);
    setError(null);
    setStatuses((prev) => ({ ...prev, [id]: next }));

    const response = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    setPending(null);

    if (!response.ok) {
      setStatuses((prev) => ({ ...prev, [id]: current }));
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not update the listing");
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <ul className="mt-3 flex flex-col gap-3">
        {listings.map((listing) => {
          const status = statuses[listing.id] ?? "available";
          const isTaken = status === "taken";
          return (
            <li
              key={listing.id}
              className="flex items-center gap-3 rounded-lg border-2 border-border bg-card p-3"
            >
              <Link
                href={`/listings/${listing.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-xs font-bold">
                  {listing.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, not a static import
                    <img
                      src={listing.photo_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    initialsFor(listing.name)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-base">
                    {listing.name}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isTaken ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {isTaken ? "Taken" : "Available"}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => toggle(listing.id)}
                disabled={pending === listing.id}
                aria-pressed={isTaken}
                className={cn(
                  "shrink-0 rounded-lg border-2 border-border px-3 py-2 text-sm font-bold shadow-[2px_2px_0_var(--border)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50",
                  isTaken ? "bg-card" : "bg-primary text-primary-foreground",
                )}
              >
                {isTaken ? "Mark available" : "Mark taken"}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

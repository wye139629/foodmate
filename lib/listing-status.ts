export const LISTING_STATUSES = ["available", "taken", "complete"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** A listing is auto-delisted this many hours after it is created (FR-009). */
export const LISTING_ACTIVE_HOURS = 48;

const ACTIVE_WINDOW_MS = LISTING_ACTIVE_HOURS * 60 * 60 * 1000;

/**
 * ISO timestamp cutoff: listings created at or before this are expired and must
 * be hidden from the map, the board, and detail pages. Pass to a Supabase
 * `.gte("created_at", ...)` filter.
 */
export function listingActiveCutoffIso(now: number = Date.now()): string {
  return new Date(now - ACTIVE_WINDOW_MS).toISOString();
}

export function isListingExpired(
  createdAtIso: string,
  now: number = Date.now(),
): boolean {
  return new Date(createdAtIso).getTime() <= now - ACTIVE_WINDOW_MS;
}

/** The two states an owner can toggle a live listing between. */
export function isOwnerTogglableStatus(
  value: unknown,
): value is "available" | "taken" {
  return value === "available" || value === "taken";
}

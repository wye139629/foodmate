-- FoodMate: let an owner mark a share "taken" (claimed / no longer up for
-- grabs) and toggle it back to "available". FR-005 slice. "complete" stays
-- reserved for a future finished-exchange state - nothing sets it yet.
--
-- The 48h auto-delist (FR-009) is enforced at the application layer (a
-- created_at cutoff in every listing query), not here - no cron, no column.

alter table public.listings drop constraint if exists listings_status_check;

alter table public.listings
  add constraint listings_status_check
  check (status in ('available', 'taken', 'complete'));

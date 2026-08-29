-- FoodMate: an optional 0-10 star rating for the other person, alongside the
-- feedback tags. Nullable - a feedback row can still be tags-only.

alter table public.feedback
  add column if not exists stars smallint
  check (stars is null or (stars between 0 and 10));

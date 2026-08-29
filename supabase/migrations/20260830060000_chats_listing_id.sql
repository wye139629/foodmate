-- Lets a chat remember which listing started it, so the chat window can
-- show real listing context (name/photo/status) instead of a fabricated
-- "rating" card with no data behind it.
alter table public.chats
  add column listing_id uuid references public.listings (id) on delete set null;

-- FoodMate: post-exchange peer feedback (an FR-008 slice / the deferred
-- "Bowl Rating"). After a share, a neighbour leaves up to 3 positive tags plus
-- an optional short note about the other person. Collected now, not surfaced
-- yet - nothing in the app reads it back.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  chat_id uuid references public.chats (id) on delete set null,
  tags text[] not null,
  note text,
  created_at timestamptz not null default now(),
  constraint feedback_not_self check (from_user_id <> to_user_id),
  constraint feedback_tag_count check (cardinality(tags) between 1 and 3),
  constraint feedback_has_context check (listing_id is not null or chat_id is not null)
);

-- One feedback per author per context, so tags can't be stacked by
-- re-submitting. Partial indexes because either column can be null.
create unique index if not exists feedback_unique_author_chat
  on public.feedback (from_user_id, chat_id)
  where chat_id is not null;
create unique index if not exists feedback_unique_author_listing
  on public.feedback (from_user_id, listing_id)
  where listing_id is not null;

create index if not exists feedback_to_user_idx on public.feedback (to_user_id);

alter table public.feedback enable row level security;

-- drop-then-create so this migration is safe to re-run (the table was applied
-- ahead of merge under an earlier filename).
drop policy if exists "feedback is readable by the people it concerns" on public.feedback;
create policy "feedback is readable by the people it concerns"
  on public.feedback for select
  to authenticated
  using (auth.uid() in (from_user_id, to_user_id));

drop policy if exists "users write feedback they author" on public.feedback;
create policy "users write feedback they author"
  on public.feedback for insert
  to authenticated
  with check (from_user_id = auth.uid() and from_user_id <> to_user_id);

-- FoodMate initial schema (T000)
-- users: handled by Supabase Auth (auth.users) — no custom table needed.

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  photo_url text,
  lat double precision not null,
  lng double precision not null,
  status text not null default 'available' check (status in ('available', 'complete')),
  created_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references auth.users (id) on delete cascade,
  user_id_2 uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists listings_status_idx on public.listings (status);
create index if not exists messages_chat_id_idx on public.messages (chat_id);
create index if not exists chats_participants_idx on public.chats (user_id_1, user_id_2);

-- Realtime: subscribers get notified of new messages.
alter publication supabase_realtime add table public.messages;

-- Row Level Security: all app access requires a logged-in user (SPEC.md Section 3).
alter table public.listings enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

create policy "listings are readable by any logged-in user"
  on public.listings for select
  to authenticated
  using (true);

create policy "owners manage their own listings"
  on public.listings for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "participants read their own chats"
  on public.chats for select
  to authenticated
  using (auth.uid() in (user_id_1, user_id_2));

create policy "logged-in users create chats they participate in"
  on public.chats for insert
  to authenticated
  with check (auth.uid() in (user_id_1, user_id_2));

create policy "participants read messages in their chats"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and auth.uid() in (chats.user_id_1, chats.user_id_2)
    )
  );

create policy "participants send messages in their chats"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and auth.uid() in (chats.user_id_1, chats.user_id_2)
    )
  );

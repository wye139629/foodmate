-- FoodMate: "Looking For" requests (board page). Not an existing SPEC.md FR -
-- new, minimal table so the board's request feed has something real to read.

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists requests_created_at_idx on public.requests (created_at desc);

alter table public.requests enable row level security;

create policy "requests are readable by any logged-in user"
  on public.requests for select
  to authenticated
  using (true);

create policy "users manage their own requests"
  on public.requests for all
  to authenticated
  using (requester_id = auth.uid())
  with check (requester_id = auth.uid());

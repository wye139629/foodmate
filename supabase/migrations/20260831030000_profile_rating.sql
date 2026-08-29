-- FoodMate: a public star rating on each profile, averaged from the private
-- feedback rows. The feedback table itself is RLS-locked to the two people
-- involved, so the aggregate is denormalised here (profiles is readable by any
-- logged-in user) and kept in sync by a trigger.

alter table public.profiles
  add column if not exists rating numeric(3, 1),
  add column if not exists ratings_count integer not null default 0;

create or replace function public.recompute_profile_rating(target uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.profiles p
  set rating = sub.avg_stars,
      ratings_count = sub.n
  from (
    select
      round(avg(stars)::numeric, 1) as avg_stars,
      count(*) as n
    from public.feedback
    where to_user_id = target and stars is not null
  ) sub
  where p.id = target;
$$;

create or replace function public.feedback_rating_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.recompute_profile_rating(coalesce(new.to_user_id, old.to_user_id));
  return null;
end;
$$;

drop trigger if exists feedback_rating_sync on public.feedback;
create trigger feedback_rating_sync
  after insert or update or delete on public.feedback
  for each row execute function public.feedback_rating_sync();

-- Backfill any feedback that already exists.
update public.profiles p
set rating = sub.avg_stars,
    ratings_count = sub.n
from (
  select to_user_id,
         round(avg(stars)::numeric, 1) as avg_stars,
         count(*) as n
  from public.feedback
  where stars is not null
  group by to_user_id
) sub
where p.id = sub.to_user_id;

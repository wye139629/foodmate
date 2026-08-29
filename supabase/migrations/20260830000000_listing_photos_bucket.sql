-- FoodMate: Storage bucket for listing photos (T002 / FR-002, FR-002b)

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "public read of listing photos"
  on storage.objects for select
  to public
  using (bucket_id = 'listing-photos');

create policy "authenticated users upload listing photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-photos');

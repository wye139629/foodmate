-- FoodMate: student ID verification (safety pillar, manual review).
-- Status is informational only — never blocks onboarding or app use, just
-- shown as a trust signal on listings/profile once approved.

alter table public.profiles
  add column verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  add column verification_photo_path text;

-- Private bucket: uploaded ID photos are real PII, never public. Users can
-- only write/read their own file (path is "<user id>/<filename>"); admin
-- review reads happen server-side via the service-role key, bypassing RLS,
-- not through a policy here.
insert into storage.buckets (id, name, public)
values ('student-ids', 'student-ids', false)
on conflict (id) do nothing;

create policy "users manage their own id photo"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'student-ids' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'student-ids' and (storage.foldername(name))[1] = auth.uid()::text);

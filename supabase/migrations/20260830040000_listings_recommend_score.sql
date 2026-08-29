alter table public.listings
  add column recommend_score smallint check (recommend_score between 0 and 10),
  add column recommend_reason text;

-- FoodMate: tags are now optional on feedback (the star rating is the required
-- part). Relax the count check from 1-3 to 0-3.

alter table public.feedback drop constraint if exists feedback_tag_count;

alter table public.feedback
  add constraint feedback_tag_count check (cardinality(tags) <= 3);

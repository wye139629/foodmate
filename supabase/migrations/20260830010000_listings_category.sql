-- FoodMate: category filter (T003 refinement, FR-007 slice pulled forward)

alter table public.listings
  add column category text
  check (
    category in (
      'Korean', 'Italian', 'Chinese', 'Western',
      'Mexican', 'Thai', 'Dessert', 'Other'
    )
  );

export const LISTING_CATEGORIES = [
  "Korean",
  "Italian",
  "Chinese",
  "Western",
  "Mexican",
  "Thai",
  "Dessert",
  "Other",
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export function isListingCategory(value: unknown): value is ListingCategory {
  return (
    typeof value === "string" &&
    (LISTING_CATEGORIES as readonly string[]).includes(value)
  );
}

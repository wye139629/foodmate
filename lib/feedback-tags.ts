export const FEEDBACK_TAGS = [
  "Friendly",
  "Easy to talk to",
  "On time",
  "Item as described",
  "Thoughtful",
  "Helpful",
  "Would share again",
] as const;

export type FeedbackTag = (typeof FEEDBACK_TAGS)[number];

export const MAX_FEEDBACK_TAGS = 3;
export const MAX_FEEDBACK_NOTE_LENGTH = 280;
export const MAX_FEEDBACK_STARS = 10;

export function isFeedbackStars(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_FEEDBACK_STARS
  );
}

export function isFeedbackTag(value: unknown): value is FeedbackTag {
  return (
    typeof value === "string" &&
    (FEEDBACK_TAGS as readonly string[]).includes(value)
  );
}

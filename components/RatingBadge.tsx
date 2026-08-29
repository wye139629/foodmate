import { cn } from "@/lib/utils";

/**
 * A user's averaged feedback-star rating, styled to match the dish
 * recommend-score badge. Renders nothing until the user has been rated.
 */
export default function RatingBadge({
  rating,
  size = "sm",
  className,
}: {
  rating: number | null | undefined;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (rating == null) return null;

  const value = Number(rating);
  const label = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-border bg-secondary font-bold text-secondary-foreground",
        size === "lg"
          ? "border-2 px-3 py-1 text-sm shadow-[2px_2px_0_var(--border)]"
          : "border px-2 py-0.5 text-xs",
        className,
      )}
    >
      ⭐ {label}/10
    </span>
  );
}

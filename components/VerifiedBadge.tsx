import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Trust signal for a manually-reviewed student ID. Renders nothing until verified. */
export default function VerifiedBadge({
  status,
  size = "sm",
  className,
}: {
  status: string | null | undefined;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (status !== "verified") return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border-border bg-accent font-bold text-accent-foreground",
        size === "lg"
          ? "border-2 px-3 py-1 text-sm shadow-[2px_2px_0_var(--border)]"
          : "border px-2 py-0.5 text-xs",
        className,
      )}
    >
      <ShieldCheck className={size === "lg" ? "size-4" : "size-3"} />
      Verified Student
    </span>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex size-9 items-center justify-center rounded-full border-2 border-border bg-card/90 shadow-[2px_2px_0_var(--border)] backdrop-blur"
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}

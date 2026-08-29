"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Mounted once in the root layout, so it only appears on an actual page
// load (first visit / hard refresh) — client-side navigation between
// routes never remounts the layout, so it won't flash on every tab switch.
export default function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "hidden">("visible");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading"), 700);
    const hideTimer = setTimeout(() => setPhase("hidden"), 1000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-300",
        phase === "fading" ? "opacity-0" : "opacity-100",
      )}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- app icon, not a static import */}
      <img src="/icons/icon-512.png" alt="" className="size-40" />
    </div>
  );
}

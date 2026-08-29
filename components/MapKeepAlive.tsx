"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MapView from "@/components/MapView";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase-auth";

export default function MapKeepAlive() {
  const pathname = usePathname();
  const onMap = pathname === "/map";
  const [opened, setOpened] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [initial, setInitial] = useState("G");

  useEffect(() => {
    if (onMap) setOpened(true);
  }, [onMap]);

  useEffect(() => {
    if (!opened) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
      setInitial((data.user?.email ?? "G").charAt(0).toUpperCase());
    });
  }, [opened]);

  if (!opened) return null;

  return (
    <div
      className="fixed inset-0 z-20 flex h-dvh min-h-0 w-full flex-col bg-background"
      style={{ transform: onMap ? "none" : "translateX(-100%)" }}
      aria-hidden={!onMap}
    >
      <header className="z-10 flex items-center justify-between border-b-2 border-border bg-card px-4 pt-3 pb-3">
        <h1 className="font-heading text-xl">Map Discovery</h1>
        <Link
          href="/profile"
          className="flex size-6 items-center justify-center rounded-full border-2 border-border bg-muted text-xs font-medium"
        >
          {initial}
        </Link>
      </header>
      <MapView currentUserId={currentUserId} active={onMap} />
      <BottomNav unreadChats={1} />
    </div>
  );
}

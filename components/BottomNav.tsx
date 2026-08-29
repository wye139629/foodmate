"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Map, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/board", label: "Shares", icon: ClipboardList },
  { href: "/map", label: "Map", icon: Map },
  { href: "/chat", label: "Chats", icon: MessageCircle },
] as const;

// ponytail: unread count is a prop until FR-004 chat data is wired in
export default function BottomNav({ unreadChats = 0 }: { unreadChats?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex h-16 w-full border-t-2 border-border bg-background">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        const isMap = href === "/map";

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5",
              active && !isMap && "border-t-2 -mt-[2px] border-border bg-accent/20",
            )}
          >
            {isMap ? (
              <span className="-mt-8 flex size-14 items-center justify-center rounded-full border-2 border-border bg-card shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]">
                <Icon className="size-5" />
              </span>
            ) : (
              <span className="relative">
                <Icon className="size-5" />
                {label === "Chats" && unreadChats > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex size-5 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-bold">
                    {unreadChats}
                  </span>
                )}
              </span>
            )}
            <span
              className={cn(
                "text-xs font-bold",
                active ? "text-foreground" : "text-foreground/70",
                isMap && "text-[13px]",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

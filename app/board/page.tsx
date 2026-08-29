import Link from "next/link";
import { Map, Plus, UserRound } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import SignOutButton from "@/components/SignOutButton";
import BottomNav from "@/components/BottomNav";

// ponytail: mock data until this screen reads real listings/requests
const STATS = {
  count: 42,
  caption: "Neighbors met and shared food locally.",
};

const JUST_SHARED = [
  {
    id: "1",
    title: "Half a Pepperoni Pizza",
    description: "Ordered too much! Still in the box, untouched on one side.",
    photoUrl: "https://picsum.photos/seed/pizza/200/200",
    ownerName: "Maria S.",
    ownerInitials: "MA",
  },
  {
    id: "2",
    title: "Chicken Curry & Roti",
    description: "Got a huge portion for takeout. Happy to share the extra curry.",
    photoUrl: "https://picsum.photos/seed/curry/200/200",
    ownerName: "Tom W.",
    ownerInitials: "TO",
  },
];

const LOOKING_FOR = [
  { id: "1", title: "2 eggs for baking", requesterName: "Ji-ho P.", requesterInitials: "JI" },
  { id: "2", title: "A bit of flour (approx 100g)", requesterName: "David C.", requesterInitials: "DA" },
];

export default async function BoardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "Guest";
  const initial = email.charAt(0).toUpperCase();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 pt-12 pb-24">
      <header className="flex items-center justify-between border-b-2 border-border pb-4">
        <h1 className="font-heading text-2xl">Nearby Shares</h1>
        <SignOutButton className="size-6 rounded-full border p-0 text-xs">
          {initial}
        </SignOutButton>
      </header>

      <section className="mt-6 flex flex-col justify-between rounded-2xl border-2 border-border bg-accent p-6 shadow-[4px_4px_0_var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            <span className="flex size-12 items-center justify-center rounded-full border-2 border-border bg-card shadow-[2px_2px_0_var(--border)]">
              <UserRound className="size-5" />
            </span>
            <span className="flex size-12 items-center justify-center rounded-full border-2 border-border bg-secondary shadow-[2px_2px_0_var(--border)]">
              <UserRound className="size-5" />
            </span>
          </div>
          <span className="-rotate-3 rounded-full border-2 border-border bg-card px-3 py-1.5 font-heading text-xs tracking-wide uppercase shadow-[2px_2px_0_var(--border)]">
            This Week
          </span>
        </div>
        <div className="mt-8">
          <p className="font-heading text-6xl tracking-tight">{STATS.count}</p>
          <p className="mt-3 text-lg font-bold">{STATS.caption}</p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between border-b-2 border-border pb-2">
          <h2 className="font-heading text-sm tracking-wide uppercase">Just Shared</h2>
          <Link
            href="/map"
            className="flex size-8 items-center justify-center rounded-full border border-border bg-muted"
          >
            <Map className="size-4" />
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-4">
          {JUST_SHARED.map((item) => (
            <li
              key={item.id}
              className="flex overflow-hidden rounded-lg border-2 border-border bg-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- mock photo, not a Supabase-hosted listing photo */}
              <img
                src={item.photoUrl}
                alt=""
                className="h-[140px] w-[130px] shrink-0 border-r-2 border-border object-cover"
              />
              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <p className="font-heading text-base">{item.title}</p>
                  <p className="mt-1 text-sm font-medium">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold">
                    {item.ownerInitials}
                  </span>
                  <span className="text-sm font-bold">{item.ownerName}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between border-b-2 border-border pb-2">
          <h2 className="font-heading text-sm tracking-wide uppercase">Looking For</h2>
          <button className="flex size-8 items-center justify-center rounded-full border border-border bg-muted">
            <Plus className="size-4" />
          </button>
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {LOOKING_FOR.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border-2 border-dashed border-border bg-card/50 p-4"
            >
              <p className="font-heading text-base">{item.title}</p>
              <div className="mt-3 flex items-center gap-2 border-t border-dashed border-border/50 pt-3">
                <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold">
                  {item.requesterInitials}
                </span>
                <span className="text-sm font-bold">{item.requesterName}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <BottomNav unreadChats={1} />
    </main>
  );
}

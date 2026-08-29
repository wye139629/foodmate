import Link from "next/link";
import { Map as MapIcon, UserRound } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import BottomNav from "@/components/BottomNav";
import PostRequestButton from "@/components/PostRequestButton";

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

// ponytail: no completed_at column exists yet, so "this week" uses
// created_at as a proxy — swap for a real completion timestamp if the
// gap between "listed" and "completed" ever matters for this stat.
function getWeekAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

async function getDisplayNames(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  ids: string[],
) {
  if (ids.length === 0) return new Map<string, string>();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", ids);
  return new Map((data ?? []).map((row) => [row.id, row.display_name as string]));
}

export default async function BoardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "Guest";
  const initial = email.charAt(0).toUpperCase();

  const weekAgo = getWeekAgoIso();

  const [{ data: justShared }, { data: lookingFor }, { count: weeklyShareCount }] =
    await Promise.all([
      supabase
        .from("listings")
        .select("id, name, description, photo_url, owner_id, recommend_score")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("requests")
        .select("id, item_name, requester_id")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "complete")
        .gte("created_at", weekAgo),
    ]);

  const names = await getDisplayNames(supabase, [
    ...(justShared ?? []).map((l) => l.owner_id),
    ...(lookingFor ?? []).map((r) => r.requester_id),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 pt-12 pb-24">
      <header className="flex items-center justify-between border-b-2 border-border pb-4">
        <h1 className="font-heading text-2xl">Nearby Shares</h1>
        <Link
          href="/profile"
          className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium"
        >
          {initial}
        </Link>
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
          <p className="font-heading text-6xl tracking-tight">{weeklyShareCount ?? 0}</p>
          <p className="mt-3 text-lg font-bold">Neighbors met and shared food locally.</p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between border-b-2 border-border pb-2">
          <h2 className="font-heading text-sm tracking-wide uppercase">Just Shared</h2>
          <Link
            href="/map"
            className="flex size-8 items-center justify-center rounded-full border border-border bg-muted"
          >
            <MapIcon className="size-4" />
          </Link>
        </div>
        {justShared && justShared.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-4">
            {justShared.map((item) => {
              const ownerName = names.get(item.owner_id) ?? "A neighbor";
              return (
                <li
                  key={item.id}
                  className="flex overflow-hidden rounded-lg border-2 border-border bg-card"
                >
                  {item.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, not a static import
                    <img
                      src={item.photo_url}
                      alt=""
                      className="h-[140px] w-[130px] shrink-0 border-r-2 border-border object-cover"
                    />
                  ) : (
                    <div className="h-[140px] w-[130px] shrink-0 border-r-2 border-border bg-muted" />
                  )}
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-heading text-base">{item.name}</p>
                        {item.recommend_score !== null && (
                          <span className="shrink-0 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                            ⭐ {item.recommend_score}/10
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm font-medium">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold">
                        {initialsFor(ownerName)}
                      </span>
                      <span className="text-sm font-bold">{ownerName}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No shares yet — be the first!</p>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between border-b-2 border-border pb-2">
          <h2 className="font-heading text-sm tracking-wide uppercase">Looking For</h2>
          <PostRequestButton />
        </div>
        {lookingFor && lookingFor.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-3">
            {lookingFor.map((item) => {
              const requesterName = names.get(item.requester_id) ?? "A neighbor";
              return (
                <li
                  key={item.id}
                  className="rounded-lg border-2 border-dashed border-border bg-card/50 p-4"
                >
                  <p className="font-heading text-base">{item.item_name}</p>
                  <div className="mt-3 flex items-center gap-2 border-t border-dashed border-border/50 pt-3">
                    <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold">
                      {initialsFor(requesterName)}
                    </span>
                    <span className="text-sm font-bold">{requesterName}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No requests yet.</p>
        )}
      </section>

      <BottomNav unreadChats={1} />
    </main>
  );
}

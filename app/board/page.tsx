import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { listingActiveCutoffIso } from "@/lib/listing-status";
import BottomNav from "@/components/BottomNav";
import YourShares from "@/components/YourShares";

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
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
  // Middleware already verified this request's JWT with a network round-trip
  // (auth.getUser()) before rendering started — getSession() just decodes the
  // already-verified cookie locally, no second round-trip.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  const email = user?.email ?? "Guest";
  const initial = email.charAt(0).toUpperCase();

  const activeCutoff = listingActiveCutoffIso();

  // "Just Shared" is what *other* neighbours are offering - the viewer's own
  // listings live in "Your Shares" below, so they're filtered out here.
  let justSharedQuery = supabase
    .from("listings")
    .select("id, name, description, photo_url, owner_id, recommend_score, status")
    .gte("created_at", activeCutoff)
    .order("created_at", { ascending: false })
    .limit(5);
  if (user) justSharedQuery = justSharedQuery.neq("owner_id", user.id);

  const [{ data: justShared }, { data: yourShares }] = await Promise.all([
    justSharedQuery,
    user
      ? supabase
          .from("listings")
          .select("id, name, photo_url, status, created_at")
          .eq("owner_id", user.id)
          .gte("created_at", activeCutoff)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const names = await getDisplayNames(
    supabase,
    (justShared ?? []).map((l) => l.owner_id),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pt-12 pb-24">
      <header className="flex items-center justify-between border-b-2 border-border pb-4">
        <h1 className="font-heading text-2xl">Nearby Shares</h1>
        <Link
          href="/profile"
          className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium"
        >
          {initial}
        </Link>
      </header>

      {yourShares && yourShares.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between border-b-2 border-border pb-2">
            <h2 className="font-heading text-sm tracking-wide uppercase">
              Your Shares
            </h2>
          </div>
          <YourShares listings={yourShares} />
        </section>
      )}

      <section className="mt-6">
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
                <li key={item.id}>
                  <Link
                    href={`/listings/${item.id}`}
                    className="flex h-[140px] overflow-hidden rounded-lg border-2 border-border bg-card"
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
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-heading text-base">{item.name}</p>
                          {item.status === "taken" && (
                            <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
                              Taken
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-sm font-medium">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold">
                            {initialsFor(ownerName)}
                          </span>
                          <span className="truncate text-sm font-bold">{ownerName}</span>
                        </div>
                        {item.recommend_score !== null && (
                          <span className="shrink-0 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                            ⭐ {item.recommend_score}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No shares yet — be the first!</p>
        )}
      </section>

      <BottomNav />
    </main>
  );
}

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { isListingExpired } from "@/lib/listing-status";
import SignOutButton from "@/components/SignOutButton";
import BottomNav from "@/components/BottomNav";
import ListingStatusToggle from "@/components/ListingStatusToggle";
import RatingBadge from "@/components/RatingBadge";

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: listings }] = await Promise.all([
    user
      ? supabase
          .from("profiles")
          .select("display_name, created_at, rating")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("listings")
          .select("id, name, description, photo_url, status, recommend_score, created_at")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const displayName = profile?.display_name ?? "Guest";
  // A listing is "live" for 48h after posting (FR-009); expired ones drop off
  // everywhere, this page included.
  const available = (listings ?? []).filter(
    (l) =>
      (l.status === "available" || l.status === "taken") &&
      !isListingExpired(l.created_at),
  );
  const shared = (listings ?? []).filter((l) => l.status === "complete");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 pt-12 pb-24">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-primary/20 font-heading text-lg font-bold">
            {initialsFor(displayName)}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-heading text-base font-bold">{displayName}</p>
              <RatingBadge rating={profile?.rating} />
            </div>
            {profile?.created_at && (
              <p className="text-sm font-medium text-muted-foreground">
                Member since {memberSince(profile.created_at)}
              </p>
            )}
          </div>
        </div>
        <SignOutButton className="h-9 rounded-lg px-3 text-sm font-semibold">
          Log out
        </SignOutButton>
      </div>

      <div className="mb-8 flex overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex-1 border-r border-border p-4 text-center">
          <p className="font-heading text-2xl font-bold">{available.length}</p>
          <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
            Active
          </p>
        </div>
        <div className="flex-1 p-4 text-center">
          <p className="font-heading text-2xl font-bold">{shared.length}</p>
          <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
            Shared
          </p>
        </div>
      </div>

      <Link
        href="/listings/new"
        className="mb-8 rounded-lg border border-dashed border-border py-3 text-center text-sm font-semibold"
      >
        + Share something new
      </Link>

      {available.length > 0 && (
        <div className="mb-8">
          <p className="mb-2 px-1 font-heading text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Available
          </p>
          <div className="-mx-4 border-t border-border bg-card">
            {available.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center gap-4 border-b border-border px-4 py-4"
              >
                <Link
                  href={`/listings/${listing.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {listing.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, not a static import
                      <img
                        src={listing.photo_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ShoppingBag className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-base font-bold">
                      {listing.name}
                    </p>
                    {listing.description && (
                      <p className="mt-0.5 truncate text-sm font-medium text-muted-foreground">
                        {listing.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium">
                        {listing.status === "taken" ? "Taken" : "Available"}
                      </span>
                      {listing.recommend_score !== null && (
                        <span className="text-xs font-medium text-muted-foreground">
                          ⭐ {listing.recommend_score}/10
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <ListingStatusToggle
                  listingId={listing.id}
                  initialStatus={listing.status}
                  className="shrink-0"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {shared.length > 0 && (
        <div>
          <p className="mb-2 px-1 font-heading text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Shared
          </p>
          <div className="-mx-4 border-t border-border bg-muted/30">
            {shared.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center gap-4 border-b border-border px-4 py-4 opacity-70"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {listing.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, not a static import
                    <img
                      src={listing.photo_url}
                      alt=""
                      className="size-full object-cover grayscale"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ShoppingBag className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-base font-bold text-muted-foreground">
                    {listing.name}
                  </p>
                  <span className="mt-1.5 inline-block rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium">
                    Shared
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(listings ?? []).length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-14 text-center">
          <p className="font-heading text-base font-bold">Nothing shared yet</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Post your first listing to get started!
          </p>
        </div>
      )}

      <BottomNav unreadChats={1} />
    </main>
  );
}

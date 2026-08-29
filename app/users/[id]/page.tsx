import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { isListingExpired } from "@/lib/listing-status";
import BackButton from "@/components/BackButton";
import RatingBadge from "@/components/RatingBadge";
import VerifiedBadge from "@/components/VerifiedBadge";

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Own profile has the edit/logout view already — send them there instead.
  if (user?.id === id) {
    redirect("/profile");
  }

  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, created_at, rating, verification_status")
      .eq("id", id)
      .single(),
    supabase
      .from("listings")
      .select("id, name, photo_url, status, recommend_score, created_at")
      .eq("owner_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <BackButton />
      </main>
    );
  }

  const available = (listings ?? []).filter(
    (l) =>
      (l.status === "available" || l.status === "taken") &&
      !isListingExpired(l.created_at),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 pt-6 pb-24">
      <div className="mb-8">
        <BackButton />
      </div>

      <div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
        <span className="flex size-14 items-center justify-center rounded-full border-2 border-border bg-primary/20 font-heading text-lg font-bold">
          {initialsFor(profile.display_name)}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-base font-bold">
              {profile.display_name}
            </p>
            <RatingBadge rating={profile.rating} />
            <VerifiedBadge status={profile.verification_status} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Neighbour since {memberSince(profile.created_at)}
          </p>
        </div>
      </div>

      {available.length > 0 ? (
        <div>
          <p className="mb-2 px-1 font-heading text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Currently Sharing
          </p>
          <div className="border-t border-border bg-card">
            {available.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex items-center gap-4 border-b border-border px-4 py-4"
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
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border py-14 text-center">
          <p className="font-heading text-base font-bold">
            Nothing shared right now
          </p>
        </div>
      )}
    </main>
  );
}

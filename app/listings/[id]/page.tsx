import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { isListingExpired } from "@/lib/listing-status";
import BackButton from "@/components/BackButton";
import RatingBadge from "@/components/RatingBadge";
import { Button } from "@/components/ui/button";

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  // Middleware already verified this request's JWT with a network round-trip
  // (auth.getUser()) before rendering started — getSession() just decodes the
  // already-verified cookie locally, no second round-trip. Session and
  // listing are independent, so fetch them together.
  const [
    {
      data: { session },
    },
    { data: listing },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("listings").select("*").eq("id", id).single(),
  ]);
  const user = session?.user;

  if (!listing || isListingExpired(listing.created_at)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">
          {listing ? "This share is no longer available." : "Listing not found."}
        </p>
        <BackButton />
      </main>
    );
  }

  const { data: sharer } = await supabase
    .from("profiles")
    .select("display_name, created_at, rating")
    .eq("id", listing.owner_id)
    .single();

  const sharerName = sharer?.display_name ?? "A neighbor";
  const isOwn = listing.owner_id === user?.id;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-28">
      <div className="absolute top-0 left-0 z-10 w-full p-4">
        <BackButton />
      </div>

      <div className="relative h-72 w-full border-b-2 border-border bg-muted">
        {listing.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, not a static import
          <img src={listing.photo_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ShoppingBag className="size-12 text-muted-foreground" />
          </div>
        )}
        {listing.category && (
          <div className="absolute right-4 bottom-4 rounded-md border-2 border-border bg-secondary px-3 py-1.5 font-heading text-xs tracking-widest uppercase shadow-[2px_2px_0_var(--border)]">
            {listing.category}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 px-5 pt-6">
        <div>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl leading-tight">{listing.name}</h1>
              {listing.status === "taken" && (
                <span className="rounded-full border-2 border-border bg-muted px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase">
                  Taken
                </span>
              )}
            </div>
            {listing.recommend_score !== null && (
              <span className="shrink-0 rounded-full border-2 border-border bg-secondary px-3 py-1 text-sm font-bold shadow-[2px_2px_0_var(--border)]">
                ⭐ {listing.recommend_score}/10
              </span>
            )}
          </div>
          {listing.description && (
            <p className="text-base leading-relaxed font-medium text-foreground/90">
              {listing.description}
            </p>
          )}
          {listing.recommend_reason && (
            <p className="mt-2 text-sm text-muted-foreground">
              {listing.recommend_reason}
            </p>
          )}
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0_var(--border)]">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-full border-2 border-border bg-primary/20 font-heading text-lg font-bold">
              {initialsFor(sharerName)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-lg font-bold">{sharerName}</h3>
                <RatingBadge rating={sharer?.rating} size="lg" />
              </div>
              {sharer?.created_at && (
                <p className="text-sm font-medium text-muted-foreground">
                  Neighbour since {memberSince(sharer.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-20 bg-gradient-to-t from-background via-background to-transparent p-5">
        <div className="mx-auto max-w-sm">
          {isOwn ? (
            <p className="text-center text-sm font-bold text-muted-foreground">
              This is your listing
            </p>
          ) : (
            <Button asChild className="h-14 w-full text-base">
              <Link
                href={`/chat/new?ownerId=${listing.owner_id}&listingId=${listing.id}`}
              >
                Chat with {sharerName.split(" ")[0]}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

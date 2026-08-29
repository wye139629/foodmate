import Link from "next/link";
import { cn } from "@/lib/utils";
import ListingStatusToggle from "@/components/ListingStatusToggle";

interface OwnListing {
  id: string;
  name: string;
  photo_url: string | null;
  status: string;
  created_at: string;
}

function initialsFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function YourShares({ listings }: { listings: OwnListing[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-4">
      {listings.map((listing) => {
        const isTaken = listing.status === "taken";
        return (
          <li
            key={listing.id}
            className="flex h-[140px] overflow-hidden rounded-lg border-2 border-border bg-card"
          >
            <Link
              href={`/listings/${listing.id}`}
              className="flex h-[140px] w-[130px] shrink-0 items-center justify-center border-r-2 border-border bg-muted font-heading text-lg font-bold"
            >
              {listing.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, not a static import
                <img
                  src={listing.photo_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                initialsFor(listing.name)
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
              <div className="min-w-0">
                <Link
                  href={`/listings/${listing.id}`}
                  className="block truncate font-heading text-base"
                >
                  {listing.name}
                </Link>
                <p
                  className={cn(
                    "mt-1 text-sm font-bold",
                    isTaken ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {isTaken ? "Taken" : "Available"}
                </p>
              </div>
              <ListingStatusToggle
                listingId={listing.id}
                initialStatus={listing.status}
                className="self-end"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

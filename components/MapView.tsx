"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Script from "next/script";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LISTING_CATEGORIES, type ListingCategory } from "@/lib/listing-categories";

interface Listing {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  category: ListingCategory | null;
  lat: number;
  lng: number;
  distanceKm: number;
  created_at: string;
}

const RADIUS_OPTIONS = [5, 10, 25, 50];

// Small deterministic "scattered photo" rotation per marker, keyed off the
// listing id so it doesn't jump around on re-render. Degrees, not Tailwind
// classes, so the count badge can counter-rotate to stay upright.
const MARKER_ROTATIONS = [-6, -3, 3, 6, -4, 4];
function rotationFor(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = hash * 31 + id.charCodeAt(i);
  return MARKER_ROTATIONS[Math.abs(hash) % MARKER_ROTATIONS.length];
}

declare global {
  interface Window {
    google: typeof google;
  }
}

function groupByCoordinate(listings: Listing[]): Listing[][] {
  const groups = new Map<string, Listing[]>();
  for (const listing of listings) {
    const key = `${listing.lat},${listing.lng}`;
    const group = groups.get(key);
    if (group) {
      group.push(listing);
    } else {
      groups.set(key, [listing]);
    }
  }
  return Array.from(groups.values());
}

export default function MapView({
  currentUserId,
}: {
  currentUserId: string | null;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const positionMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [position, setPosition] = useState<GeolocationCoordinates | null>(
    null,
  );
  const [radiusKm, setRadiusKm] = useState(10);
  const [category, setCategory] = useState<ListingCategory | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch current location every time the map opens (SPEC.md Section 7).
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition(pos.coords),
      () => setError("Could not get your current location"),
    );
  }, []);

  // Initialize the map once the script has loaded and we have a position.
  useEffect(() => {
    if (!scriptLoaded || !position || !mapDivRef.current || mapRef.current) {
      return;
    }
    mapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center: { lat: position.latitude, lng: position.longitude },
      zoom: 13,
      mapId: "FOODMATE_MAP",
      disableDefaultUI: true,
      zoomControl: true,
    });
    infoWindowRef.current = new window.google.maps.InfoWindow();

    const dot = document.createElement("div");
    dot.className = "size-[18px] rounded-[6px] border-2 border-card bg-accent";
    positionMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement(
      {
        map: mapRef.current,
        position: { lat: position.latitude, lng: position.longitude },
        content: dot,
        zIndex: 0,
      },
    );
  }, [scriptLoaded, position]);

  // Fetch nearby listings whenever position, radius, or category changes.
  useEffect(() => {
    if (!position) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      lat: String(position.latitude),
      lng: String(position.longitude),
      radiusKm: String(radiusKm),
    });
    if (category) params.set("category", category);

    fetch(`/api/listings/nearby?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load nearby listings");
        return response.json();
      })
      .then((body: { listings: Listing[] }) => setListings(body.listings))
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      });

    return () => controller.abort();
  }, [position, radiusKm, category]);

  // Redraw markers whenever the listing set changes. Listings sharing exact
  // coordinates (e.g. a batch fridge scan) are grouped into one marker with
  // a count badge, matching how the data actually shows up in practice.
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    for (const marker of markersRef.current) {
      marker.map = null;
    }

    markersRef.current = groupByCoordinate(listings).map((group) => {
      const first = group[0];
      const rotation = rotationFor(first.id);
      const isOwn = group.some((listing) => listing.owner_id === currentUserId);

      const el = document.createElement("div");
      el.className = "relative size-14";

      if (group.length > 1) {
        const stack = document.createElement("div");
        stack.className =
          "absolute inset-0 rounded-[10px] border-2 border-border bg-muted";
        stack.style.transform = `translate(4px, 4px) rotate(${rotation + 6}deg)`;
        el.appendChild(stack);
      }

      const card = document.createElement("div");
      card.className = cn(
        "absolute inset-0 flex items-center justify-center overflow-hidden rounded-[10px] border-2 border-border shadow-[3px_3px_0_var(--border)]",
        isOwn ? "bg-accent" : "bg-card",
      );
      card.style.transform = `rotate(${rotation}deg)`;
      el.appendChild(card);

      if (first.photo_url) {
        const img = document.createElement("img");
        img.src = first.photo_url;
        img.alt = "";
        img.className = "size-full object-cover";
        card.appendChild(img);
      } else {
        createRoot(card).render(
          <ShoppingBag className="size-6 text-foreground" strokeWidth={2} />,
        );
      }

      if (group.length > 1) {
        const badge = document.createElement("div");
        badge.className =
          "absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-secondary-foreground shadow-[1px_1px_0_var(--border)]";
        badge.style.transform = `rotate(${-rotation}deg)`;
        badge.textContent = String(group.length);
        el.appendChild(badge);
      }

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: first.lat, lng: first.lng },
        content: el,
      });

      marker.addListener("click", () => {
        const content = group
          .map(
            (listing) =>
              `<strong>${listing.name}</strong><br/>${listing.description ?? ""}<br/>${listing.distanceKm.toFixed(1)} km away<br/><a href="/chat/new?ownerId=${listing.owner_id}">Contact the sharer</a>`,
          )
          .join("<hr/>");
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open({ map: mapRef.current, anchor: marker });
      });

      return marker;
    });
  }, [listings, currentUserId]);

  return (
    <div className="relative flex-1">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker`}
        onLoad={() => setScriptLoaded(true)}
      />

      <div ref={mapDivRef} className="absolute inset-0 bg-muted" />

      <div className="hide-scrollbar absolute top-4 left-0 z-10 flex w-full gap-2.5 overflow-x-auto px-4 pb-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={cn(
            "shrink-0 rounded-full border-2 border-border px-4 py-2 text-sm font-bold",
            category === null
              ? "bg-foreground text-background shadow-[2px_2px_0_var(--accent)]"
              : "bg-card text-foreground shadow-[2px_2px_0_var(--border)]",
          )}
        >
          All
        </button>
        {LISTING_CATEGORIES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCategory(option)}
            className={cn(
              "shrink-0 rounded-full border-2 border-border px-4 py-2 text-sm font-bold",
              category === option
                ? "bg-foreground text-background shadow-[2px_2px_0_var(--accent)]"
                : "bg-card text-foreground shadow-[2px_2px_0_var(--border)]",
            )}
          >
            {option}
          </button>
        ))}
        <label className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold shadow-[2px_2px_0_var(--border)]">
          <select
            value={radiusKm}
            onChange={(event) => setRadiusKm(Number(event.target.value))}
            className="bg-transparent"
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} km
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="absolute top-20 left-4 z-10 rounded-lg border-2 border-destructive bg-card px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button
        asChild
        className="absolute right-4 bottom-20 z-10 h-14 rounded-full px-6"
      >
        <Link href="/listings/new">
          <ShoppingBag className="size-5" /> Share Food
        </Link>
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Listing {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  created_at: string;
}

const RADIUS_OPTIONS = [5, 10, 25, 50];

declare global {
  interface Window {
    google: typeof google;
  }
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

export default function MapView() {
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
    dot.className = "size-3 rounded-full border-2 border-card bg-accent";
    positionMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement(
      {
        map: mapRef.current,
        position: { lat: position.latitude, lng: position.longitude },
        content: dot,
        zIndex: 0,
      },
    );
  }, [scriptLoaded, position]);

  // Fetch nearby listings whenever position or radius changes.
  useEffect(() => {
    if (!position) return;

    const controller = new AbortController();
    fetch(
      `/api/listings/nearby?lat=${position.latitude}&lng=${position.longitude}&radiusKm=${radiusKm}`,
      { signal: controller.signal },
    )
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
  }, [position, radiusKm]);

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
      const el = document.createElement("div");
      el.className = "relative";
      const bubble = document.createElement("div");
      bubble.className =
        "flex size-[38px] items-center justify-center rounded-full border-2 border-border bg-card shadow-[2px_2px_0_var(--border)]";
      el.appendChild(bubble);
      createRoot(bubble).render(
        <ShoppingBag className="size-5 text-foreground" strokeWidth={2} />,
      );

      if (group.length > 1) {
        const badge = document.createElement("div");
        badge.className =
          "absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-secondary-foreground";
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
  }, [listings]);

  return (
    <div className="relative flex-1">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker`}
        onLoad={() => setScriptLoaded(true)}
      />

      <div ref={mapDivRef} className="absolute inset-0 bg-muted" />

      <div className="absolute top-4 left-4 z-10 rounded-lg border-2 border-border bg-card px-3 py-2 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]">
        <label className="flex items-center gap-1.5 text-sm font-medium">
          Within
          <select
            value={radiusKm}
            onChange={(event) => setRadiusKm(Number(event.target.value))}
            className="rounded border border-border bg-transparent text-sm"
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} km
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button asChild className="absolute top-4 right-4 z-10 h-11 rounded-lg">
        <Link href="/listings/new">
          <ShoppingBag className="size-4" /> Share Food
        </Link>
      </Button>

      {error && (
        <p
          role="alert"
          className="absolute top-20 left-4 z-10 rounded-lg border-2 border-destructive bg-card px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {listings.length > 0 && (
        <div className="hide-scrollbar absolute bottom-0 left-0 z-10 flex w-full gap-3 overflow-x-auto px-4 pb-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex h-full w-[280px] shrink-0 items-center gap-3 rounded-lg border-2 border-border bg-card p-3 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {listing.photo_url && (
                  <Image
                    src={listing.photo_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-base">
                  {listing.name}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  {listing.distanceKm.toFixed(1)} km ·{" "}
                  {formatRelativeTime(listing.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

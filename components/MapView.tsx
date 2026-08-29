"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LISTING_CATEGORIES, type ListingCategory } from "@/lib/listing-categories";
import { timeAgo } from "@/lib/time-ago";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

interface Listing {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  category: ListingCategory | null;
  status: string;
  lat: number;
  lng: number;
  distanceKm: number;
  created_at: string;
  recommend_score: number | null;
  recommend_reason: string | null;
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

type UserPosition = { lat: number; lng: number; accuracy: number };

function copyPosition(coords: GeolocationCoordinates): UserPosition {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy,
  };
}

function createUserLocationDot(): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.width = "22px";
  wrap.style.height = "22px";
  wrap.style.position = "relative";

  const dot = document.createElement("div");
  dot.style.position = "absolute";
  dot.style.top = "50%";
  dot.style.left = "50%";
  dot.style.width = "16px";
  dot.style.height = "16px";
  dot.style.margin = "-8px 0 0 -8px";
  dot.style.borderRadius = "50%";
  dot.style.background = "#FF8A4C";
  dot.style.border = "3px solid #FFFDF8";
  dot.style.boxSizing = "border-box";
  dot.style.boxShadow = "0 0 0 2px #1A1A1A";
  wrap.appendChild(dot);
  return wrap;
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
  active = true,
}: {
  currentUserId: string | null;
  active?: boolean;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const positionMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [category, setCategory] = useState<ListingCategory | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Listing[] | null>(null);

  useEffect(() => {
    document.getElementById("foodmate-google-map")?.remove();
    void loadGoogleMaps()
      .then(() => setMapsLoaded(true))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load the map");
      });
  }, []);

  // Fetch current location every time the map tab is shown (SPEC.md Section 7).
  // Copy lat/lng inside the callback — storing GeolocationCoordinates itself
  // can yield 0/undefined after the callback returns (WebKit).
  useEffect(() => {
    if (!active) return;
    if (!navigator.geolocation) {
      setError("Could not get your current location");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setError((current) =>
          current === "Could not get your current location" ? null : current,
        );
        setPosition(copyPosition(pos.coords));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location access is blocked. Enable it in the browser to see your position.",
          );
        } else {
          setError("Could not get your current location");
        }
      },
      { enableHighAccuracy: true, maximumAge: 15_000 },
    );
  }, [active]);

  // Build the map as soon as the API is ready so the page is never a blank
  // cream rectangle while GPS is still resolving.
  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current || mapRef.current) return;
    if (!window.google?.maps?.Map) return;

    try {
      const map = new window.google.maps.Map(mapDivRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
      });
      mapRef.current = map;
      setMapReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the map");
    }
  }, [mapsLoaded]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !position) return;

    const map = mapRef.current;
    const center = { lat: position.lat, lng: position.lng };
    map.setCenter(center);
    map.setZoom(13);

    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = new window.google.maps.Circle({
        map,
        center,
        radius: Math.max(position.accuracy || 0, 40),
        fillColor: "#FF8A4C",
        fillOpacity: 0.18,
        strokeColor: "#FF8A4C",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        clickable: false,
        zIndex: 1,
      });
    } else {
      accuracyCircleRef.current.setCenter(center);
      accuracyCircleRef.current.setRadius(Math.max(position.accuracy || 0, 40));
      accuracyCircleRef.current.setMap(map);
    }

    const MarkerCtor = window.google.maps.marker?.AdvancedMarkerElement;
    const PinCtor = window.google.maps.marker?.PinElement;
    if (!MarkerCtor) return;

    if (!positionMarkerRef.current) {
      let content: HTMLElement;
      if (PinCtor) {
        content = new PinCtor({
          background: "#FF8A4C",
          borderColor: "#1A1A1A",
          glyphColor: "#1A1A1A",
          scale: 1.2,
        });
      } else {
        content = createUserLocationDot();
      }

      const marker = new MarkerCtor({
        map,
        position: center,
        content,
        title: "You are here",
        zIndex: 999999,
        collisionBehavior: "REQUIRED",
      });
      if (content.parentNode !== marker) {
        marker.append(content);
      }
      positionMarkerRef.current = marker;
    } else {
      positionMarkerRef.current.position = center;
      positionMarkerRef.current.map = map;
    }
  }, [mapReady, position]);

  useEffect(() => {
    if (!active || !mapRef.current) return;
    if (position) {
      mapRef.current.setCenter({ lat: position.lat, lng: position.lng });
    }
  }, [active, position]);

  // Fetch nearby listings whenever position, radius, or category changes.
  useEffect(() => {
    if (!position) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      lat: String(position.lat),
      lng: String(position.lng),
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
    if (!mapReady || !mapRef.current || !window.google) return;

    // Not clearing selectedGroup here on purpose: this effect also reruns on
    // background position/listings refreshes unrelated to the sheet (e.g.
    // revisiting the map tab), which would otherwise slam an open item sheet
    // shut — and its links along with it — mid-tap. The sheet is closed
    // explicitly instead, only on deliberate filter changes below.
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
      if (el.parentNode !== marker) {
        marker.append(el);
      }

      marker.addListener("click", () => {
        setSelectedGroup(group);
      });

      return marker;
    });
  }, [listings, currentUserId, mapReady]);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={mapDivRef} className="absolute inset-0 bg-muted" />

      <div className="hide-scrollbar absolute top-4 left-0 z-10 flex w-full gap-2.5 overflow-x-auto px-4 pb-2">
        <button
          type="button"
          onClick={() => {
            setCategory(null);
            setSelectedGroup(null);
          }}
          className={cn(
            "shrink-0 rounded-full border-2 border-border px-4 py-2 text-sm font-bold",
            category === null
              ? "bg-foreground text-background shadow-[2px_2px_0_var(--border)]"
              : "bg-card text-foreground shadow-[2px_2px_0_var(--border)]",
          )}
        >
          All
        </button>
        {LISTING_CATEGORIES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setCategory(option);
              setSelectedGroup(null);
            }}
            className={cn(
              "shrink-0 rounded-full border-2 border-border px-4 py-2 text-sm font-bold",
              category === option
                ? "bg-foreground text-background shadow-[2px_2px_0_var(--border)]"
                : "bg-card text-foreground shadow-[2px_2px_0_var(--border)]",
            )}
          >
            {option}
          </button>
        ))}
        <label className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold shadow-[2px_2px_0_var(--border)]">
          <select
            value={radiusKm}
            onChange={(event) => {
              setRadiusKm(Number(event.target.value));
              setSelectedGroup(null);
            }}
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

      {!selectedGroup && (
        <Button
          asChild
          className="absolute right-4 bottom-20 z-10 h-14 rounded-full px-6"
        >
          <Link href="/listings/new">
            <ShoppingBag className="size-5" /> Share Food
          </Link>
        </Button>
      )}

      {selectedGroup && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-2 border-b-0 border-border bg-card shadow-[0_-4px_0_var(--border)]">
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h2 className="font-heading text-lg">
              {selectedGroup.length} item{selectedGroup.length > 1 ? "s" : ""}{" "}
              here
            </h2>
            <button
              type="button"
              onClick={() => setSelectedGroup(null)}
              className="rounded-lg border-2 border-border bg-card px-3 py-1 text-sm font-bold shadow-[2px_2px_0_var(--border)]"
            >
              Close
            </button>
          </div>
          <ul className="max-h-[45vh] overflow-y-auto px-4 pb-4">
            {selectedGroup.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="flex items-center gap-3 border-b border-border/40 py-3 last:border-b-0"
                >
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg border-2 border-border bg-muted">
                    {listing.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, not a static import
                      <img
                        src={listing.photo_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ShoppingBag className="size-5 text-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-heading text-base">
                        {listing.name}
                      </p>
                      {listing.status === "taken" && (
                        <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
                          Taken
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.distanceKm.toFixed(1)} km ·{" "}
                      {timeAgo(listing.created_at)}
                      {listing.recommend_score !== null
                        ? ` · ⭐ ${listing.recommend_score}/10`
                        : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

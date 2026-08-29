"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface Listing {
  id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
}

const RADIUS_OPTIONS = [5, 10, 25, 50];

declare global {
  interface Window {
    google: typeof google;
  }
}

export default function MapView() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
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
      zoom: 12,
      mapId: "FOODMATE_MAP",
    });
    infoWindowRef.current = new window.google.maps.InfoWindow();
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

  // Redraw markers whenever the listing set changes.
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    for (const marker of markersRef.current) {
      marker.map = null;
    }
    markersRef.current = listings.map((listing) => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: listing.lat, lng: listing.lng },
        title: listing.name,
      });
      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(
          `<strong>${listing.name}</strong><br/>${listing.description ?? ""}<br/>${listing.distanceKm.toFixed(1)} km away`,
        );
        infoWindowRef.current?.open({ map: mapRef.current, anchor: marker });
      });
      return marker;
    });
  }, [listings]);

  return (
    <div>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker`}
        onLoad={() => setScriptLoaded(true)}
      />
      <label>
        Show within
        <select
          value={radiusKm}
          onChange={(event) => setRadiusKm(Number(event.target.value))}
        >
          {RADIUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} km
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <div ref={mapDivRef} style={{ width: "100%", height: "500px" }} />
    </div>
  );
}

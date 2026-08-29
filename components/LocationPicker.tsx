"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

export interface LatLng {
  lat: number;
  lng: number;
}

export default function LocationPicker({
  onChange,
}: {
  onChange: (position: LatLng) => void;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const onChangeRef = useRef(onChange);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    void loadGoogleMaps()
      .then(() => setMapsLoaded(true))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load the map"),
      );
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current || mapRef.current) return;
    if (!navigator.geolocation) {
      setError("Could not get your current location");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        const map = new window.google.maps.Map(mapDivRef.current!, {
          center: position,
          zoom: 16,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position,
          gmpDraggable: true,
        });
        marker.addListener("dragend", () => {
          const p = marker.position;
          if (!p) return;
          const lat = typeof p.lat === "function" ? p.lat() : p.lat;
          const lng = typeof p.lng === "function" ? p.lng() : p.lng;
          if (lat != null && lng != null) onChangeRef.current({ lat, lng });
        });
        markerRef.current = marker;

        onChangeRef.current(position);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is blocked. Enable it in the browser to set your pin."
            : "Could not get your current location",
        );
      },
      { enableHighAccuracy: true },
    );
  }, [mapsLoaded]);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-bold">Location</p>
      <div className="relative h-48 overflow-hidden rounded-lg border-2 border-border bg-muted">
        <div ref={mapDivRef} className="absolute inset-0" />
        {error && (
          <p
            role="alert"
            className="absolute inset-x-2 top-2 rounded-lg border-2 border-destructive bg-card px-3 py-2 text-xs text-destructive"
          >
            {error}
          </p>
        )}
      </div>
      <p className="text-xs font-medium text-muted-foreground">
        Drag the pin to adjust exactly where this is available.
      </p>
    </div>
  );
}

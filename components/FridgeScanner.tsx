"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-auth";

interface ScannedItem {
  name: string;
  description: string;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

async function uploadPhoto(file: File): Promise<string> {
  const supabase = createClient();
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage
    .from("listing-photos")
    .upload(path, file);
  if (error) throw error;
  return supabase.storage.from("listing-photos").getPublicUrl(path).data
    .publicUrl;
}

export default function FridgeScanner() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [items, setItems] = useState<ScannedItem[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!photo) return;
    setError(null);
    setScanning(true);
    setItems(null);

    try {
      const formData = new FormData();
      formData.append("photo", photo);

      const response = await fetch("/api/listings/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Scan failed");
      }

      const body = (await response.json()) as { items: ScannedItem[] };
      setItems(body.items);
      setSelected(new Set(body.items.map((_, index) => index)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScanning(false);
    }
  }

  function toggle(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function handleCreateSelected() {
    if (!items || !photo || selected.size === 0) return;
    setError(null);
    setSubmitting(true);

    try {
      const position = await getCurrentPosition();
      const photoUrl = await uploadPhoto(photo);

      const results = await Promise.all(
        Array.from(selected).map((index) => {
          const item = items[index];
          return fetch("/api/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              description: item.description,
              photoUrl,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
        }),
      );

      const failed = results.some((response) => !response.ok);
      if (failed) throw new Error("Some listings could not be created");

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Scan your fridge</h2>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          setPhoto(event.target.files?.[0] ?? null);
          setItems(null);
        }}
      />
      <button type="button" onClick={handleScan} disabled={!photo || scanning}>
        {scanning ? "Scanning…" : "Scan with AI"}
      </button>

      {error && <p role="alert">{error}</p>}

      {items && items.length === 0 && <p>No items detected in that photo.</p>}

      {items && items.length > 0 && (
        <>
          <ul>
            {items.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.has(index)}
                    onChange={() => toggle(index)}
                  />
                  {item.name} — {item.description}
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleCreateSelected}
            disabled={submitting || selected.size === 0}
          >
            {submitting
              ? "Adding…"
              : `Add ${selected.size} selected as listings`}
          </button>
        </>
      )}
    </section>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-auth";

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

export default function ListingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const position = await getCurrentPosition();
      const photoUrl = photo ? await uploadPhoto(photo) : undefined;

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          photoUrl,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create listing");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Share an item</h2>
      <label>
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>
      <label>
        Quantity / description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label>
        Photo (optional)
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Sharing…" : "Share"}
      </button>
    </form>
  );
}

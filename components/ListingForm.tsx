"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { LISTING_CATEGORIES, type ListingCategory } from "@/lib/listing-categories";

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
  const [category, setCategory] = useState<ListingCategory | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoChange(file: File | null) {
    setPhoto(file);
    setPhotoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  }

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
          category: category || undefined,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create listing");
      }

      router.push("/map");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 pt-6 pb-10">
      <header className="flex items-center gap-3 pb-4">
        <BackButton />
        <h1 className="font-heading text-xl">Share Food</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="mx-auto flex aspect-square w-full max-w-[220px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted text-center">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a static import
            <img
              src={photoPreview}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <>
              <Camera className="size-8" />
              <span className="px-4 text-sm font-bold">
                Tap to add a photo (optional)
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handlePhotoChange(event.target.files?.[0] ?? null)
            }
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="listing-name" className="text-sm font-bold">
            Item Name
          </label>
          <input
            id="listing-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="e.g. Homemade kimchi"
            className="rounded-lg border-2 border-border bg-card px-3 py-2.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="listing-category" className="text-sm font-bold">
            Category
          </label>
          <select
            id="listing-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ListingCategory | "")
            }
            className="rounded-lg border-2 border-border bg-card px-3 py-2.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Select a category (optional)</option>
            {LISTING_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="listing-description" className="text-sm font-bold">
            Story / Description
          </label>
          <textarea
            id="listing-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="What is it, how much, why are you sharing it?"
            className="resize-none rounded-lg border-2 border-border bg-card px-3 py-2.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border-2 border-destructive bg-card px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="h-12 text-base">
          {submitting ? "Publishing…" : "Publish to Neighborhood"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-auth";

export default function StudentIdUpload({ userId }: { userId: string }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(file: File | null) {
    setPhoto(file);
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function submit() {
    if (!photo) return;
    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = photo.name.split(".").pop() || "jpg";
      const path = `${userId}/id-card.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("student-ids")
        .upload(path, photo, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ verification_status: "pending", verification_photo_path: path })
        .eq("id", userId);
      if (profileError) throw profileError;

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload your ID — try again",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-3">
      <label
        htmlFor="student-id-upload"
        className="flex h-24 cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed border-[#8A8A8A] bg-background px-4 text-center"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a static import
          <img src={preview} alt="" className="h-full object-cover" />
        ) : (
          <span className="text-[13px] font-semibold">
            Tap to upload a photo of your student ID
          </span>
        )}
        <input
          id="student-id-upload"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleChange(event.target.files?.[0] ?? null)}
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {photo && (
        <button
          type="button"
          onClick={submit}
          disabled={uploading}
          className="mt-2 h-9 w-full rounded-lg border border-border bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Submit for review"}
        </button>
      )}
    </div>
  );
}

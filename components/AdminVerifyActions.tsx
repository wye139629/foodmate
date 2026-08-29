"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminVerifyActionsProps {
  userId: string;
}

export default function AdminVerifyActions({ userId }: AdminVerifyActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "verified" | "rejected") {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/admin/verifications/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not save that decision");
      setPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => decide("verified")}
          disabled={pending}
          className={cn(
            "flex-1 rounded-lg border-2 border-border bg-accent px-3 py-2 text-sm font-bold text-accent-foreground disabled:opacity-50",
          )}
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          disabled={pending}
          className="flex-1 rounded-lg border-2 border-border bg-card px-3 py-2 text-sm font-bold disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

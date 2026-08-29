"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAgree() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarded: true },
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(searchParams.get("redirectedFrom") ?? "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-6 pt-16 pb-8">
      <h1 className="text-2xl leading-8 font-bold text-foreground">
        Before you start
      </h1>
      <p className="pt-1 text-base leading-6 text-foreground">
        FoodMate connects you with real people nearby for real, in-person
        handoffs. A few things to agree to first.
      </p>

      <section className="pt-8">
        <h2 className="text-xl leading-7 font-semibold text-foreground">
          Meet safely
        </h2>
        <ul className="list-disc space-y-2 pt-3 pl-5 text-base text-foreground">
          <li>Always meet in a public place, not a private home.</li>
          <li>Confirm who you&apos;re meeting beforehand in chat.</li>
          <li>
            Trust your judgment — you can decline or cancel any exchange, any
            time.
          </li>
        </ul>
      </section>

      <section className="pt-8">
        <h2 className="text-xl leading-7 font-semibold text-foreground">
          Community rules
        </h2>
        <ul className="list-disc space-y-2 pt-3 pl-5 text-base text-foreground">
          <li>Only share food that&apos;s genuinely safe to eat.</li>
          <li>
            No payment or trading for money — this is sharing, not a
            marketplace.
          </li>
          <li>Be respectful and honest with the people you meet.</li>
        </ul>
      </section>

      {error && (
        <p role="alert" className="pt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={handleAgree}
        disabled={loading}
        className="mt-8 h-11 rounded-lg text-[15px] font-semibold"
      >
        {loading ? "Continuing…" : "I agree — continue"}
      </Button>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main>Loading…</main>}>
      <OnboardingContent />
    </Suspense>
  );
}

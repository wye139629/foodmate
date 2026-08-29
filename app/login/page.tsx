"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const redirectedFrom = new URLSearchParams(window.location.search).get(
        "redirectedFrom",
      );
      const onboarded = data.user?.user_metadata?.onboarded === true;
      if (onboarded) {
        const next =
          redirectedFrom &&
          redirectedFrom.startsWith("/") &&
          !redirectedFrom.startsWith("//") &&
          redirectedFrom !== "/onboarding"
            ? redirectedFrom
            : "/map";
        router.push(next);
      } else {
        const onboarding = new URL("/onboarding", window.location.origin);
        if (redirectedFrom) {
          onboarding.searchParams.set("redirectedFrom", redirectedFrom);
        }
        router.push(`${onboarding.pathname}${onboarding.search}`);
      }
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
        Welcome to FoodMate
      </h1>
      <p className="pt-1 text-base leading-6 text-foreground">
        Share surplus food and discover nearby items in your community
      </p>

      <h2 className="pt-8 text-xl leading-7 font-semibold text-foreground">
        Sign In
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col pt-5">
        <div>
          <Label htmlFor="email" className="mb-1.5">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-11 rounded-lg border-2"
          />
        </div>

        <div className="pt-4">
          <Label htmlFor="password" className="mb-1.5">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-11 rounded-lg border-2"
          />
        </div>

        {error && (
          <p role="alert" className="pt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-5 h-11 rounded-lg text-[15px] font-semibold"
        >
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="pt-5 text-base text-foreground">New to FoodMate?</p>
      <Button
        asChild
        variant="outline"
        className="mt-2 h-11 rounded-lg text-[15px] font-semibold"
      >
        <Link href="/signup">Create Account</Link>
      </Button>

      <p className="pt-8 pb-8 text-base leading-[26px] text-foreground">
        By signing in, you agree to coordinate exchanges in safe, public
        meetup locations only
      </p>
    </main>
  );
}

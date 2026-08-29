"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.push("/onboarding");
        router.refresh();
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-6 pt-16 pb-8">
        <h1 className="text-2xl leading-8 font-bold text-foreground">
          Check your email
        </h1>
        <p className="pt-1 text-base leading-6 text-foreground">
          We sent a confirmation link to {email}. Follow it to finish setting
          up your account.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-6 pt-16 pb-8">
      <h1 className="text-2xl leading-8 font-bold text-foreground">
        Join FoodMate
      </h1>
      <p className="pt-1 text-base leading-6 text-foreground">
        Share surplus food and discover nearby items in your community
      </p>

      <h2 className="pt-8 text-xl leading-7 font-semibold text-foreground">
        Create Account
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="h-11 rounded-lg border-2"
          />
          <p className="pt-1.5 text-sm text-muted-foreground">
            At least 6 characters
          </p>
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
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <p className="pt-5 text-base text-foreground">
        Already have an account?
      </p>
      <Button
        asChild
        variant="outline"
        className="mt-2 h-11 rounded-lg text-[15px] font-semibold"
      >
        <Link href="/login">Log In</Link>
      </Button>

      <p className="pt-8 pb-8 text-base leading-[26px] text-foreground">
        By creating an account, you agree to coordinate exchanges in safe,
        public meetup locations only
      </p>
    </main>
  );
}

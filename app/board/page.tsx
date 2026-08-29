import { createServerSupabaseClient } from "@/lib/supabase-auth";
import SignOutButton from "@/components/SignOutButton";

export default async function BoardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "Guest";
  const initial = email.charAt(0).toUpperCase();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 pt-12">
      <div className="flex items-center justify-between border-b-2 border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border-2 border-border bg-muted font-heading text-sm">
            {initial}
          </div>
          <p className="font-heading text-base">{email}</p>
        </div>
        <SignOutButton />
      </div>

      <p className="pt-8 text-base text-muted-foreground">
        Your listings and exchange history are coming soon.
      </p>
    </main>
  );
}

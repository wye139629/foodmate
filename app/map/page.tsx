import Link from "next/link";
import MapView from "@/components/MapView";
import { createServerSupabaseClient } from "@/lib/supabase-auth";

export default async function MapPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = (user?.email ?? "G").charAt(0).toUpperCase();

  return (
    <main className="flex h-screen flex-col">
      <header className="z-10 flex items-center justify-between border-b-2 border-border bg-card px-4 pt-3 pb-3">
        <h1 className="font-heading text-xl">Map Discovery</h1>
        <Link
          href="/board"
          className="flex size-6 items-center justify-center rounded-full border-2 border-border bg-muted text-xs font-medium"
        >
          {initial}
        </Link>
      </header>
      <MapView />
    </main>
  );
}

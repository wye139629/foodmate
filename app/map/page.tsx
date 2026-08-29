import { createServerSupabaseClient } from "@/lib/supabase-auth";

export default async function MapPage() {
  await createServerSupabaseClient();
  return <main className="h-dvh bg-background" />;
}

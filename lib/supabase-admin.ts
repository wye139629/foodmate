import { createClient } from "@supabase/supabase-js";

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/** Service-role client — bypasses RLS. Server-only, never import from a Client Component. */
export function createAdminSupabaseClient() {
  return createClient(
    required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    required(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY"),
  );
}

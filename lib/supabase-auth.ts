import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const SUPABASE_URL = () => env("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY = () => env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

/** Browser client, for use in Client Components. */
export function createClient() {
  return createBrowserClient(SUPABASE_URL(), SUPABASE_KEY());
}

/** Server client, for use in Server Components / Route Handlers. */
export async function createServerSupabaseClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL(), SUPABASE_KEY(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });
}

/** Server client bound to a middleware request/response pair. */
export function createMiddlewareSupabaseClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(SUPABASE_URL(), SUPABASE_KEY(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
}

/** Routes that require a logged-in user (SPEC.md Section 3). */
const PROTECTED_PATH_PREFIXES = ["/map", "/listings", "/chat"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

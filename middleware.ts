import { NextResponse, type NextRequest } from "next/server";
import {
  createMiddlewareSupabaseClient,
  isProtectedPath,
} from "@/lib/supabase-auth";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  const supabase = createMiddlewareSupabaseClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/map/:path*", "/listings/:path*", "/chat/:path*"],
};

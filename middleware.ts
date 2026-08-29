import { NextResponse, type NextRequest } from "next/server";
import {
  createMiddlewareSupabaseClient,
  isProtectedPath,
} from "@/lib/supabase-auth";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return response;
  }

  const supabase = createMiddlewareSupabaseClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const onboarded = user.user_metadata?.onboarded === true;
  if (onboarded && pathname === "/onboarding") {
    const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
    const target =
      redirectedFrom &&
      redirectedFrom.startsWith("/") &&
      !redirectedFrom.startsWith("//") &&
      redirectedFrom !== "/onboarding"
        ? redirectedFrom
        : "/map";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!onboarded && pathname !== "/onboarding") {
    const onboardingUrl = new URL("/onboarding", request.url);
    onboardingUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(onboardingUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/map/:path*",
    "/listings/:path*",
    "/chat/:path*",
    "/board/:path*",
    "/feedback/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
  ],
};

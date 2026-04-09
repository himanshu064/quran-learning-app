import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { type NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/surahs", "/reader", "/teaching", "/letters", "/mcq", "/writing", "/lessons", "/admin"];
const authPaths = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export default async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const isProtectedEarly = protectedPaths.some((p) => pathname.startsWith(p));
  const isSignUp = pathname.startsWith("/auth/sign-up");

  // Only fetch site settings when actually needed (sign-up gate or maintenance gate)
  let settings: Record<string, string> = {};
  if (isSignUp || isProtectedEarly) {
    try {
      const { data } = await betterFetch<Record<string, string>>(
        "/api/settings",
        { baseURL: request.nextUrl.origin },
      );
      if (data) settings = data;
    } catch {
      // If settings fetch fails, continue without blocking
    }
  }

  // Block sign-up if registration is disabled
  if (isSignUp && settings.registration_enabled === "false") {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Check for session token cookie
  const sessionTokenCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  let session: Session | null = null;

  if (sessionTokenCookie?.value) {
    try {
      const { data } = await betterFetch<Session>(
        "/api/auth/get-session",
        {
          baseURL: request.nextUrl.origin,
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        },
      );
      session = data;
    } catch {
      session = null;
    }
  }

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));
  const isRoot = pathname === "/";

  if (!session) {
    if (isProtected) {
      const from = encodeURIComponent(pathname);
      const response = NextResponse.redirect(
        new URL(`/auth/sign-in?from=${from}`, request.url),
      );
      response.cookies.delete("better-auth.session_data");
      return response;
    }
    if (isRoot) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
    return NextResponse.next();
  }

  // User is authenticated
  const userStatus = (session as unknown as { user?: { status?: string; role?: string } })
    ?.user?.status;
  const userRole = (session as unknown as { user?: { role?: string } })
    ?.user?.role;

  // Redirect authenticated users from auth pages or root based on role
  if (isAuthPage || isRoot) {
    const target = userRole === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Block non-admins from accessing admin routes
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Suspended users
  if (isProtected && userStatus !== "active") {
    return NextResponse.redirect(new URL("/auth/suspended", request.url));
  }

  // Maintenance mode
  if (
    isProtected &&
    settings.maintenance_mode === "true"
  ) {
    return NextResponse.redirect(
      new URL("/maintenance", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|otf|json|mp3|mp4|webm)).*)",
  ],
};

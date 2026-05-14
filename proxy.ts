import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { MONITOR_COOKIE, MONITOR_LOGIN_PATH } from "@/lib/constants";
import { verifySession } from "@/lib/monitor-auth";
import { isRouteAllowed } from "@/lib/rbac";
import type { UserRole } from "@/lib/types";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Monitor PIN guard ──────────────────────────────────────────────────────
  if (pathname.startsWith("/monitor") && pathname !== MONITOR_LOGIN_PATH) {
    const token = request.cookies.get(MONITOR_COOKIE)?.value ?? "";
    const pin = process.env.ROADMAP_PIN ?? "";
    // Verify the HMAC-signed session token — a bare cookie value or forged
    // token won't pass because it can't be derived without the PIN.
    if (!token || !verifySession(token, pin)) {
      const loginUrl = new URL(MONITOR_LOGIN_PATH, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Supabase session refresh ───────────────────────────────────────────────
  // Must run on every request so the session cookie stays fresh.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes session if expired — must be called before any auth check
  const { data: { user } } = await supabase.auth.getUser();

  // ── Route protection ───────────────────────────────────────────────────────
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isPublicRoute =
    pathname === "/" ||
    isAuthRoute ||
    pathname.startsWith("/monitor") ||
    pathname.startsWith("/api/monitor/") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding");

  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Role-based route protection ───────────────────────────────────────────
  // Only query the DB when the route actually requires a specific role.
  if (user) {
    const isCoachRoute = pathname.startsWith("/clients") || pathname.startsWith("/playbook");
    const isAdminRoute = pathname.startsWith("/admin");

    if (isCoachRoute || isAdminRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = (profile?.role ?? "user") as UserRole;

      if (!isRouteAllowed(pathname, role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

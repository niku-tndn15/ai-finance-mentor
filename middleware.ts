import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth/config"

// Fast edge gate for protected routes (IMPLEMENTATION_PLAN.md M1 "session
// middleware"). Edge middleware can't reach Postgres/Prisma, so this only does
// the cheap check — is a session cookie present? — and redirects to /login if
// not. The authoritative DB-backed validation (is the session real and
// unexpired?) happens in the (app) layout via getCurrentUser, which also
// attaches the user for server components.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE)
  if (hasSession) return NextResponse.next()

  const loginUrl = new URL("/login", req.url)
  // Remember where they were headed so we can bounce back after login later.
  loginUrl.searchParams.set("next", req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

// Only run on the authenticated surfaces. Everything else (/, auth pages, api,
// assets) is public and handled elsewhere. The questionnaire (/onboarding,
// /setup) comes after login, so it's protected like the rest of the app.
export const config = {
  matcher: [
    "/home/:path*",
    "/coach/:path*",
    "/goals/:path*",
    "/habits/:path*",
    "/review/:path*",
    "/account/:path*",
    "/onboarding/:path*",
    "/setup/:path*",
    "/result/:path*",
  ],
}

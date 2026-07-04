import { createHash, randomBytes } from "crypto"
import { cookies } from "next/headers"
import { cache } from "react"

import { prisma } from "@/lib/db"

import {
  PENDING_COOKIE,
  PENDING_TTL_MS,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from "./config"

// The cookie carries a random opaque token; only its SHA-256 hash is stored, so
// a DB leak can't be replayed as a login (TECH_STACK.md §4.4).
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function baseCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    // Secure everywhere except local http dev, so the cookie still works on
    // `next dev`. Netlify serves https, so this is `true` in production.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  }
}

interface RequestMeta {
  userAgent?: string | null
  ip?: string | null
}

// Creates a Session row and sets the httpOnly session cookie.
export async function createSession(userId: string, meta: RequestMeta = {}): Promise<void> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: meta.userAgent ?? undefined,
      ip: meta.ip ?? undefined,
    },
  })

  cookies().set(SESSION_COOKIE, token, baseCookieOptions(SESSION_TTL_MS))
}

type SessionUser = {
  id: string
  email: string
  name: string | null
  emailVerifiedAt: Date | null
  createdAt: Date
  sessionCreatedAt: Date
}

// Resolves the logged-in user from the session cookie, or null. Wrapped in
// React `cache` so multiple calls in one request (layout + page) hit the DB
// once. Invalid/expired sessions resolve to null (the cookie is cleaned up
// lazily on the next mutating request rather than here, since server components
// can't write cookies).
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    emailVerifiedAt: session.user.emailVerifiedAt,
    createdAt: session.user.createdAt,
    sessionCreatedAt: session.createdAt,
  }
})

// Deletes the current session row and clears the cookie (logout / revoke).
export async function destroyCurrentSession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {}) // already gone is fine
  }
  cookies().delete(SESSION_COOKIE)
}

// Revokes every session for a user — used after a password change/reset so a
// stolen session can't outlive the credential change (TECH_STACK.md §4.4).
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } })
}

// --- Pending (post-OTP) cookie plumbing for the set-password step ---

export function setPendingCookie(token: string): void {
  cookies().set(PENDING_COOKIE, token, baseCookieOptions(PENDING_TTL_MS))
}

export function getPendingCookie(): string | undefined {
  return cookies().get(PENDING_COOKIE)?.value
}

export function clearPendingCookie(): void {
  cookies().delete(PENDING_COOKIE)
}

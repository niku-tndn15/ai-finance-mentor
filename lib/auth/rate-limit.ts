import type { OtpPurpose, User } from "@prisma/client"

import { prisma } from "@/lib/db"

import {
  LOGIN_LOCKOUT_MS,
  LOGIN_MAX_FAILURES,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_COOLDOWN_MS,
} from "./config"

// DB-counter based rate limiting — no extra infra at MVP scale; upgrade path is
// Upstash Redis (TECH_STACK.md §4.5). All limits fail *closed* (block) so a DB
// hiccup never opens a hole.

type RateResult = { ok: true } | { ok: false; retryAfterSeconds: number; reason: string }

// Enforces the 60s cooldown + max-5-sends/hour caps before issuing a new OTP
// (§4.5). Counted per email+purpose against the OtpCode table.
export async function checkOtpSendRate(
  email: string,
  purpose: OtpPurpose
): Promise<RateResult> {
  const now = Date.now()
  const hourAgo = new Date(now - 60 * 60 * 1000)

  const recent = await prisma.otpCode.findMany({
    where: { email, purpose, createdAt: { gte: hourAgo } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })

  if (recent.length > 0) {
    const sinceLast = now - recent[0].createdAt.getTime()
    if (sinceLast < OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - sinceLast) / 1000),
        reason: "cooldown",
      }
    }
  }

  if (recent.length >= OTP_MAX_SENDS_PER_HOUR) {
    const oldest = recent[recent.length - 1].createdAt.getTime()
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((oldest + 60 * 60 * 1000 - now) / 1000),
      reason: "hourly_cap",
    }
  }

  return { ok: true }
}

// True if the account is currently in a login lockout window (§4.5).
export function isLockedOut(user: Pick<User, "lockedUntil">): boolean {
  return !!user.lockedUntil && user.lockedUntil > new Date()
}

// Records a failed password attempt and locks the account once the threshold is
// crossed inside the rolling window.
export async function registerFailedLogin(user: User): Promise<void> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - LOGIN_LOCKOUT_MS)

  // Reset the counter if the last failure is older than the window.
  const withinWindow =
    user.lastFailedLoginAt && user.lastFailedLoginAt > windowStart
  const nextCount = (withinWindow ? user.failedLoginCount : 0) + 1

  const lock = nextCount >= LOGIN_MAX_FAILURES
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: nextCount,
      lastFailedLoginAt: now,
      lockedUntil: lock ? new Date(now.getTime() + LOGIN_LOCKOUT_MS) : user.lockedUntil,
    },
  })
}

// Clears the failure counters after a successful login.
export async function clearLoginFailures(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lastFailedLoginAt: null, lockedUntil: null },
  })
}

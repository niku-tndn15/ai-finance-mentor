import type { OtpPurpose } from "@prisma/client"

import { prisma } from "@/lib/db"

import { OTP_MAX_ATTEMPTS } from "./config"
import { verifyOtp } from "./otp"

type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many_attempts" | "mismatch" }

// Checks a submitted code against the newest live OTP for a user+purpose and
// enforces the max-attempts rule (TECH_STACK.md §4.5). On success the code is
// consumed (single-use); on a wrong guess the attempt counter increments and,
// once it hits the limit, the code is invalidated so a new one must be
// requested.
export async function verifyOtpCode(
  userId: string,
  purpose: OtpPurpose,
  code: string
): Promise<VerifyResult> {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  })

  if (!otp) return { ok: false, reason: "no_code" }

  if (otp.expiresAt < new Date()) {
    return { ok: false, reason: "expired" }
  }

  // Already at/over the cap (e.g. a concurrent burst) — treat as spent.
  if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    })
    return { ok: false, reason: "too_many_attempts" }
  }

  if (!verifyOtp(code, otp.codeHash)) {
    const attempts = otp.attemptCount + 1
    const invalidate = attempts >= OTP_MAX_ATTEMPTS
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: {
        attemptCount: attempts,
        consumedAt: invalidate ? new Date() : null,
      },
    })
    return { ok: false, reason: invalidate ? "too_many_attempts" : "mismatch" }
  }

  // Correct code — consume it so it can't be replayed.
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  })
  return { ok: true }
}

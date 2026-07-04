import { prisma } from "@/lib/db"
import { setPendingCookie } from "@/lib/auth/session"
import { createPendingToken } from "@/lib/auth/tokens"
import { verifyOtpCode } from "@/lib/auth/verify-otp-service"
import { fail, ok, parseBody } from "@/lib/http"
import { verifyOtpSchema } from "@/lib/validation/auth"

const errorCopy: Record<string, string> = {
  no_code: "That code has expired. Please request a new one.",
  expired: "That code has expired. Please request a new one.",
  too_many_attempts: "Too many incorrect attempts. Please request a new code.",
  mismatch: "That code isn't right. Please try again.",
}

// OTP verify (IMPLEMENTATION_PLAN.md M1). Handles both signup verification and
// password reset. On success it issues a short-lived signed "pending" cookie
// that the set-password / reset-password step requires — so knowing a verified
// email alone isn't enough to set a password (lib/auth/tokens.ts).
export async function POST(req: Request) {
  const parsed = await parseBody(req, verifyOtpSchema)
  if (!parsed.ok) return parsed.response
  const { email, code, purpose } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Generic — don't confirm whether the email exists.
    return fail(errorCopy.no_code, 400, { code: "invalid_code" })
  }

  const result = await verifyOtpCode(user.id, purpose, code)
  if (!result.ok) {
    const status = result.reason === "too_many_attempts" ? 429 : 400
    return fail(errorCopy[result.reason], status, { code: result.reason })
  }

  if (purpose === "signup_verification" && !user.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    })
  }

  setPendingCookie(createPendingToken(user.id, purpose))
  return ok({ purpose })
}

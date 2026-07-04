import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import {
  clearPendingCookie,
  createSession,
  getPendingCookie,
} from "@/lib/auth/session"
import { verifyPendingToken } from "@/lib/auth/tokens"
import { getClientIp, getUserAgent } from "@/lib/auth/request"
import { fail, ok, parseBody } from "@/lib/http"
import { setPasswordSchema } from "@/lib/validation/auth"

// Set password after signup OTP (IMPLEMENTATION_PLAN.md M1). Requires the
// signed "pending" cookie from the verify step, hashes with bcrypt, creates a
// session + httpOnly cookie, and hands the client the onboarding redirect.
export async function POST(req: Request) {
  const parsed = await parseBody(req, setPasswordSchema)
  if (!parsed.ok) return parsed.response

  const pending = verifyPendingToken(getPendingCookie(), "signup_verification")
  if (!pending) {
    return fail("Your session expired. Please verify your email again.", 401, {
      code: "pending_expired",
    })
  }

  const user = await prisma.user.findUnique({ where: { id: pending.userId } })
  if (!user || !user.emailVerifiedAt) {
    return fail("Your session expired. Please verify your email again.", 401, {
      code: "pending_expired",
    })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  })

  clearPendingCookie()
  await createSession(user.id, {
    userAgent: getUserAgent(req),
    ip: getClientIp(req),
  })

  return ok({ redirect: "/onboarding" })
}

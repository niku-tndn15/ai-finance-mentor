import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { getClientIp, getUserAgent } from "@/lib/auth/request"
import { fail, ok, parseBody } from "@/lib/http"
import { signupSchema } from "@/lib/validation/auth"

// Signup (IMPLEMENTATION_PLAN.md M1). Single step: name + email + password.
// Email OTP verification has been removed, so we create the account with the
// password hash, mark the email as verified up front (so login's verification
// check passes), open a session, and send the user straight to onboarding.
export async function POST(req: Request) {
  const parsed = await parseBody(req, signupSchema)
  if (!parsed.ok) return parsed.response
  const { name, email, password } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email } })

    // A completed account already exists — steer them to login rather than
    // silently overwriting their password.
    if (existing?.passwordHash) {
      return fail("An account with this email already exists. Please log in instead.", 409, {
        code: "account_exists",
      })
    }

    const passwordHash = await hashPassword(password)
    const now = new Date()

    // Reuse any leftover unverified stub (e.g. from the old OTP flow) instead of
    // colliding on the unique email; otherwise create a fresh user.
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name, passwordHash, emailVerifiedAt: existing.emailVerifiedAt ?? now },
        })
      : await prisma.user.create({
          data: { name, email, passwordHash, emailVerifiedAt: now },
        })

    await createSession(user.id, {
      userAgent: getUserAgent(req),
      ip: getClientIp(req),
    })

    // New account → straight into the questionnaire.
    return ok({ redirect: "/onboarding" })
  } catch (error) {
    console.error("[auth/signup] failed", error)
    return fail("We couldn't create your account right now. Please try again in a moment.", 503, {
      code: "signup_unavailable",
    })
  }
}

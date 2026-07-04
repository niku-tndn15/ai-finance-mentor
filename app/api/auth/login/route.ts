import { prisma } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import {
  clearLoginFailures,
  isLockedOut,
  registerFailedLogin,
} from "@/lib/auth/rate-limit"
import { getClientIp, getUserAgent } from "@/lib/auth/request"
import { fail, ok, parseBody } from "@/lib/http"
import { loginSchema } from "@/lib/validation/auth"

// A pre-computed bcrypt hash of a throwaway string. We run a compare against it
// when the email is unknown so response timing doesn't reveal whether an
// account exists.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8DkPS5B0kY0oQ9F2wJ2b6qkQ8e5nS"

const GENERIC = "Incorrect email or password."

// Login (IMPLEMENTATION_PLAN.md M1). Verifies bcrypt hash and enforces the
// 5-failures-per-15-min lockout (TECH_STACK.md section 4.5).
export async function POST(req: Request) {
  const parsed = await parseBody(req, loginSchema)
  if (!parsed.ok) return parsed.response
  const { email, password } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.passwordHash) {
      // Normalise timing even when there's nothing to compare against.
      await verifyPassword(password, DUMMY_HASH)
      return fail(GENERIC, 401)
    }

    if (isLockedOut(user)) {
      return fail(
        "Too many attempts. Your account is temporarily locked. Please try again in a few minutes.",
        423,
        { code: "locked" }
      )
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      await registerFailedLogin(user)
      return fail(GENERIC, 401)
    }

    if (!user.emailVerifiedAt) {
      // Shouldn't happen (password implies verification) but guard anyway.
      return fail("Please verify your email before logging in.", 403, { code: "unverified" })
    }

    await clearLoginFailures(user.id)
    await createSession(user.id, {
      userAgent: getUserAgent(req),
      ip: getClientIp(req),
    })

    // Existing users with a saved plan go straight to their data (no
    // questionnaire); anyone who never finished setup is sent to complete it.
    const hasModel = await prisma.income.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    return ok({ redirect: hasModel ? "/home" : "/onboarding" })
  } catch (error) {
    console.error("[auth/login] failed", error)
    return fail("Login is temporarily unavailable. Please try again in a moment.", 503, {
      code: "login_unavailable",
    })
  }
}

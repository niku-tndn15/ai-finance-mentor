import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import {
  clearPendingCookie,
  destroyAllSessions,
  getPendingCookie,
} from "@/lib/auth/session"
import { clearLoginFailures } from "@/lib/auth/rate-limit"
import { verifyPendingToken } from "@/lib/auth/tokens"
import { fail, ok, parseBody } from "@/lib/http"
import { setPasswordSchema } from "@/lib/validation/auth"

// Set a new password during the forgot-password flow (IMPLEMENTATION_PLAN.md
// M1). Requires the "pending" cookie issued after a password_reset OTP verify.
// Unlike set-password it does NOT log the user in — it revokes all existing
// sessions (in case the account was compromised) and sends them to /login,
// and it also clears any login lockout so they can sign in immediately.
export async function POST(req: Request) {
  const parsed = await parseBody(req, setPasswordSchema)
  if (!parsed.ok) return parsed.response

  const pending = verifyPendingToken(getPendingCookie(), "password_reset")
  if (!pending) {
    return fail("Your session expired. Please start the reset again.", 401, {
      code: "pending_expired",
    })
  }

  const user = await prisma.user.findUnique({ where: { id: pending.userId } })
  if (!user) {
    return fail("Your session expired. Please start the reset again.", 401, {
      code: "pending_expired",
    })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  })

  await destroyAllSessions(user.id)
  await clearLoginFailures(user.id)
  clearPendingCookie()

  return ok({ redirect: "/login" })
}

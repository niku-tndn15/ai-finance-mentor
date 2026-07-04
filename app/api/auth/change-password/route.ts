import { prisma } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import {
  createSession,
  destroyAllSessions,
  getCurrentUser,
} from "@/lib/auth/session"
import { getClientIp, getUserAgent } from "@/lib/auth/request"
import { fail, ok, parseBody } from "@/lib/http"
import { changePasswordSchema } from "@/lib/validation/auth"

// Change password from account settings (IMPLEMENTATION_PLAN.md M1 — beta
// readiness). Requires the current password. On success every session is
// revoked (logging out other devices) and a fresh one is minted for this
// browser, so a stolen session can't survive a password change.
export async function POST(req: Request) {
  const current = await getCurrentUser()
  if (!current) return fail("Please log in.", 401)

  const parsed = await parseBody(req, changePasswordSchema)
  if (!parsed.ok) return parsed.response

  const user = await prisma.user.findUnique({ where: { id: current.id } })
  if (!user?.passwordHash) return fail("Please log in.", 401)

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
  if (!valid) return fail("Your current password isn't right.", 400, { code: "bad_current" })

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  })

  await destroyAllSessions(user.id)
  await createSession(user.id, {
    userAgent: getUserAgent(req),
    ip: getClientIp(req),
  })

  return ok({})
}

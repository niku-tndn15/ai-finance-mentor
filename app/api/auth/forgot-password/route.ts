import { prisma } from "@/lib/db"
import { issueOtp } from "@/lib/auth/issue-otp"
import { ok, parseBody } from "@/lib/http"
import { forgotPasswordSchema } from "@/lib/validation/auth"

// Forgot password — request a reset code (IMPLEMENTATION_PLAN.md M1).
// Always returns the same generic 200 ("if that email exists, we've sent a
// code") so it can't be used to discover which emails have accounts
// (TECH_STACK.md §4.5). Reuses the OTP infra with purpose = password_reset.
export async function POST(req: Request) {
  const parsed = await parseBody(req, forgotPasswordSchema)
  if (!parsed.ok) return parsed.response
  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })

  // Only a completed account (has a password) can reset one. Errors and rate
  // limits are swallowed so the response is indistinguishable from the
  // "no such account" case.
  if (user?.passwordHash) {
    await issueOtp({
      userId: user.id,
      email,
      purpose: "password_reset",
      name: user.name,
    }).catch(() => {})
  }

  return ok({})
}

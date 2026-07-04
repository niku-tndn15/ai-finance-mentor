import { prisma } from "@/lib/db"
import { issueOtp } from "@/lib/auth/issue-otp"
import { ok, parseBody } from "@/lib/http"
import { resendOtpSchema } from "@/lib/validation/auth"

// Resend OTP with 60s cooldown + hourly cap (enforced inside issueOtp →
// checkOtpSendRate). Always responds 200 with the same body regardless of
// whether the email exists, so it can't be used to enumerate accounts
// (TECH_STACK.md §4.5). The cooldown detail is still returned when we *do* act.
export async function POST(req: Request) {
  const parsed = await parseBody(req, resendOtpSchema)
  if (!parsed.ok) return parsed.response
  const { email, purpose } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })

  // Only resend for an eligible account; otherwise fall through to the same
  // generic response.
  const eligible =
    user &&
    (purpose === "signup_verification"
      ? !user.passwordHash // signup not finished
      : true) // password_reset: any account
  if (eligible && user) {
    const issued = await issueOtp({ userId: user.id, email, purpose, name: user.name })
    if (!issued.ok) {
      return ok({ retryAfterSeconds: issued.retryAfterSeconds, throttled: true })
    }
  }

  return ok({})
}

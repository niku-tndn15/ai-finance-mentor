import { prisma } from "@/lib/db"
import { issueOtp } from "@/lib/auth/issue-otp"
import { fail, ok, parseBody } from "@/lib/http"
import { signupSchema } from "@/lib/validation/auth"

// Signup step 1: email capture (IMPLEMENTATION_PLAN.md M1).
// Creates or reuses an unverified User, then issues a signup OTP.
export async function POST(req: Request) {
  const parsed = await parseBody(req, signupSchema)
  if (!parsed.ok) return parsed.response
  const { name, email } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email } })

    // If a fully-set-up account already exists, steer them to login. We reveal
    // this only for a completed account; unverified stubs are safe to reuse.
    if (existing?.passwordHash) {
      return fail("An account with this email already exists. Please log in instead.", 409, {
        code: "account_exists",
      })
    }

    const user = existing ?? (await prisma.user.create({ data: { email, name } }))

    // Keep the latest name if they retyped it.
    if (existing && name && existing.name !== name) {
      await prisma.user.update({ where: { id: user.id }, data: { name } })
    }

    const issued = await issueOtp({
      userId: user.id,
      email,
      purpose: "signup_verification",
      name,
    })

    if (!issued.ok) {
      return fail("Please wait a moment before requesting another code.", 429, {
        retryAfterSeconds: issued.retryAfterSeconds,
      })
    }

    return ok({ email })
  } catch (error) {
    console.error("[auth/signup] failed", error)
    return fail("We couldn't start signup right now. Please try again in a moment.", 503, {
      code: "signup_unavailable",
    })
  }
}

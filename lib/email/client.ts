import { Resend } from "resend"

import type { OtpPurpose } from "@prisma/client"

import { OtpEmail } from "@/emails/otp-email"

// One Resend client for the app. If RESEND_API_KEY isn't configured (e.g. local
// dev without email set up) we degrade gracefully: log the code to the server
// console instead of throwing, so the auth flow is still testable end-to-end.
// This must NEVER run in production without a key — guarded below.

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

// Verified sender. Override via env once a domain is set up in Resend; the
// onboarding@resend.dev sandbox sender works for early testing.
const FROM = process.env.EMAIL_FROM ?? "UrPaisa <onboarding@resend.dev>"

const subjects: Record<OtpPurpose, string> = {
  signup_verification: "Verify your email for UrPaisa",
  password_reset: "Reset your UrPaisa password",
}

export async function sendOtpEmail(params: {
  to: string
  code: string
  purpose: OtpPurpose
  name?: string | null
}): Promise<void> {
  const { to, code, purpose, name } = params

  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      // Fail loud in prod — silently not sending OTPs would strand every signup.
      throw new Error("RESEND_API_KEY is not configured")
    }
    // Dev fallback so the flow is testable without email set up.
    // eslint-disable-next-line no-console
    console.log(`[dev] OTP for ${to} (${purpose}): ${code}`)
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: subjects[purpose],
    react: OtpEmail({ code, purpose, name }),
  })

  if (error) {
    // Surface to the caller so it can return a generic error; the real reason
    // goes to Sentry via the thrown error, not to the user (PRD 09 §7).
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

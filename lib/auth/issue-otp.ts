import type { OtpPurpose } from "@prisma/client"

import { prisma } from "@/lib/db"
import { sendOtpEmail } from "@/lib/email/client"

import { OTP_TTL_MS } from "./config"
import { generateOtp, hashOtp } from "./otp"
import { checkOtpSendRate } from "./rate-limit"

type IssueResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; reason: string }

// Generates, stores (hashed), and emails a fresh OTP for a user, after checking
// send-rate limits. Shared by signup, resend-otp and forgot-password so the
// cooldown/cap rules can't diverge between them (TECH_STACK.md §4.5).
//
// Any still-valid earlier codes for the same purpose are invalidated first, so
// only the newest code works — this prevents a stockpile of live codes.
export async function issueOtp(params: {
  userId: string
  email: string
  purpose: OtpPurpose
  name?: string | null
}): Promise<IssueResult> {
  const { userId, email, purpose, name } = params

  const rate = await checkOtpSendRate(email, purpose)
  if (!rate.ok) return rate

  const code = generateOtp()

  await prisma.otpCode.updateMany({
    where: { userId, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  })

  await prisma.otpCode.create({
    data: {
      userId,
      email,
      purpose,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })

  await sendOtpEmail({ to: email, code, purpose, name })
  return { ok: true }
}

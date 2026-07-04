import { createHmac, timingSafeEqual } from "crypto"

import { PENDING_TTL_MS } from "./config"

// A stateless, tamper-proof token used only for the brief window between
// "OTP verified" and "password set". It proves the current browser just passed
// OTP for a given user+purpose, so a random third party who merely knows a
// verified email can't hijack the set-password step. Signed with SESSION_SECRET
// via HMAC — no DB row needed for something this short-lived.

type PendingPurpose = "signup_verification" | "password_reset"

interface PendingPayload {
  userId: string
  purpose: PendingPurpose
  exp: number // epoch ms
}

function secret(): string {
  const value = process.env.SESSION_SECRET
  if (!value) {
    // Fail loud in every environment — a missing signing secret silently
    // downgrades security, so we never want to limp along without it.
    throw new Error("SESSION_SECRET is not set")
  }
  return value
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function sign(data: string): string {
  return b64url(createHmac("sha256", secret()).update(data).digest())
}

export function createPendingToken(userId: string, purpose: PendingPurpose): string {
  const payload: PendingPayload = { userId, purpose, exp: Date.now() + PENDING_TTL_MS }
  const body = b64url(JSON.stringify(payload))
  return `${body}.${sign(body)}`
}

export function verifyPendingToken(
  token: string | undefined,
  purpose: PendingPurpose
): { userId: string } | null {
  if (!token) return null
  const [body, providedSig] = token.split(".")
  if (!body || !providedSig) return null

  // Constant-time signature check.
  const expectedSig = sign(body)
  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let payload: PendingPayload
  try {
    payload = JSON.parse(Buffer.from(body, "base64").toString("utf8"))
  } catch {
    return null
  }

  if (payload.purpose !== purpose) return null
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null
  return { userId: payload.userId }
}

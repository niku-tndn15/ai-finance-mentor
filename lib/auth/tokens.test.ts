import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { PENDING_TTL_MS } from "./config"
import { createPendingToken, verifyPendingToken } from "./tokens"

// Tokens are signed with SESSION_SECRET, so set a deterministic one for tests.
const ORIGINAL = process.env.SESSION_SECRET

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-for-tokens-0123456789abcdef"
})
afterAll(() => {
  process.env.SESSION_SECRET = ORIGINAL
})
afterEach(() => {
  vi.useRealTimers()
})

describe("pending token", () => {
  it("round-trips a valid token for the matching purpose", () => {
    const token = createPendingToken("user_123", "signup_verification")
    expect(verifyPendingToken(token, "signup_verification")).toEqual({ userId: "user_123" })
  })

  it("rejects a token verified against the wrong purpose", () => {
    const token = createPendingToken("user_123", "signup_verification")
    expect(verifyPendingToken(token, "password_reset")).toBeNull()
  })

  it("rejects a tampered payload (signature no longer matches)", () => {
    const token = createPendingToken("user_123", "signup_verification")
    const [, sig] = token.split(".")
    // Swap the payload for a different user id while keeping the old signature.
    const forgedBody = Buffer.from(
      JSON.stringify({ userId: "attacker", purpose: "signup_verification", exp: Date.now() + 60000 })
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    expect(verifyPendingToken(`${forgedBody}.${sig}`, "signup_verification")).toBeNull()
  })

  it("rejects an undefined or malformed token", () => {
    expect(verifyPendingToken(undefined, "signup_verification")).toBeNull()
    expect(verifyPendingToken("garbage", "signup_verification")).toBeNull()
  })

  it("rejects an expired token", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    const token = createPendingToken("user_123", "signup_verification")
    // Valid immediately...
    expect(verifyPendingToken(token, "signup_verification")).not.toBeNull()
    // ...but not once the TTL window has elapsed.
    vi.advanceTimersByTime(PENDING_TTL_MS + 1000)
    expect(verifyPendingToken(token, "signup_verification")).toBeNull()
  })
})

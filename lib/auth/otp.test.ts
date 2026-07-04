import { describe, expect, it } from "vitest"

import { generateOtp, hashOtp, verifyOtp } from "./otp"

describe("generateOtp", () => {
  it("always produces a 6-digit numeric string", () => {
    for (let i = 0; i < 500; i++) {
      const code = generateOtp()
      expect(code).toMatch(/^\d{6}$/)
    }
  })

  it("pads small values with leading zeros", () => {
    // Over many draws we expect at least one code below 100000 (a leading zero).
    const codes = Array.from({ length: 2000 }, generateOtp)
    expect(codes.some((c) => c.startsWith("0"))).toBe(true)
  })
})

describe("hashOtp / verifyOtp", () => {
  it("never stores the plaintext code", () => {
    const code = "123456"
    const hash = hashOtp(code)
    expect(hash).not.toContain(code)
    expect(hash).toHaveLength(64) // sha256 hex
  })

  it("verifies the correct code", () => {
    const hash = hashOtp("428913")
    expect(verifyOtp("428913", hash)).toBe(true)
  })

  it("rejects an incorrect code", () => {
    const hash = hashOtp("428913")
    expect(verifyOtp("428914", hash)).toBe(false)
  })

  it("rejects a malformed stored hash without throwing", () => {
    expect(verifyOtp("123456", "not-a-real-hash")).toBe(false)
  })
})

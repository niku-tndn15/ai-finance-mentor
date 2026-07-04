import { describe, expect, it } from "vitest"

import { emailSchema, otpCodeSchema, passwordSchema } from "./auth"

describe("emailSchema", () => {
  it("normalises to lowercase and trims", () => {
    expect(emailSchema.parse("  Riya@Example.COM ")).toBe("riya@example.com")
  })

  it("rejects invalid emails", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false)
    expect(emailSchema.safeParse("").success).toBe(false)
  })
})

describe("otpCodeSchema", () => {
  it("accepts exactly 6 digits", () => {
    expect(otpCodeSchema.safeParse("012345").success).toBe(true)
  })

  it("rejects wrong length or non-numeric codes", () => {
    expect(otpCodeSchema.safeParse("12345").success).toBe(false)
    expect(otpCodeSchema.safeParse("1234567").success).toBe(false)
    expect(otpCodeSchema.safeParse("12a456").success).toBe(false)
  })
})

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Str0ngPass").success).toBe(true)
  })

  it("requires length, upper, lower and a number", () => {
    expect(passwordSchema.safeParse("short1A").success).toBe(false) // too short
    expect(passwordSchema.safeParse("alllowercase1").success).toBe(false) // no upper
    expect(passwordSchema.safeParse("ALLUPPERCASE1").success).toBe(false) // no lower
    expect(passwordSchema.safeParse("NoNumbersHere").success).toBe(false) // no number
  })
})

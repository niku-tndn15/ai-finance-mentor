import { z } from "zod"

// Single source of truth for auth-input validation, shared between client forms
// and server route handlers (TECH_STACK.md §4.2 — "mirrored client + server
// side"). Import these on both sides so the rules can never drift.

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .max(254, "That email is too long")
  .email("Enter a valid email")
  // Normalise so "A@B.com" and "a@b.com" are the same account.
  .transform((value) => value.toLowerCase())

// 6-digit numeric code (TECH_STACK.md §4.2).
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code")

// Min 8 chars + at least one upper, one lower, one number (TECH_STACK.md §4.2).
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Keep it under 72 characters") // bcrypt truncates beyond 72 bytes
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number")

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(80, "That name is too long")

// --- Request body schemas (one per endpoint) ---

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
})

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  purpose: z.enum(["signup_verification", "password_reset"]),
})

export const resendOtpSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["signup_verification", "password_reset"]),
})

export const setPasswordSchema = z.object({
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"), // don't leak rules on login
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: passwordSchema,
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>

// Describes the strength rules to the UI without duplicating the regexes.
export const passwordRules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
] as const

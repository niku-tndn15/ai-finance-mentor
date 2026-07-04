import { z } from "zod"

// Shared client+server validation for Milestone 2 (onboarding PRD 01 §6 +
// financial situation model PRD 02 §2–§5). The string literal unions here mirror
// the Prisma enums exactly (same values), so the API route can hand the parsed
// data straight to Prisma without a mapping layer — but we keep them as plain zod
// enums (not `z.nativeEnum(Prisma...)`) so this module stays importable from
// client components without pulling @prisma/client into the browser bundle.

// --- Enum mirrors (must match prisma/schema.prisma) ---

export const userTypeSchema = z.enum([
  "working_professional",
  "student_with_income",
  "freelancer_gig",
  "other",
])

export const incomeTypeSchema = z.enum(["fixed_salary", "variable_income", "mixed_income"])

export const coachingToneSchema = z.enum([
  "friendly",
  "direct",
  "strict",
  "calm",
  "motivational",
])

export const negotiabilitySchema = z.enum(["non_negotiable", "semi_negotiable"])

export const goalFlexibilitySchema = z.enum(["fixed", "flexible"])

export const debtTypeSchema = z.enum([
  "credit_card",
  "personal_loan",
  "education_loan",
  "vehicle_loan",
  "bnpl",
  "informal",
  "other",
])

export const riskLevelSchema = z.enum(["low", "medium", "high"])

// Convenience value-union aliases (used by the onboarding/setup client screens).
export type UserTypeValue = z.infer<typeof userTypeSchema>
export type IncomeTypeValue = z.infer<typeof incomeTypeSchema>
export type CoachingToneValue = z.infer<typeof coachingToneSchema>
export type NegotiabilityValue = z.infer<typeof negotiabilitySchema>
export type DebtTypeValue = z.infer<typeof debtTypeSchema>
export type RiskLevelValue = z.infer<typeof riskLevelSchema>

// --- Shared field helpers ---

// Whole INR rupees. Coerced so the API tolerates numeric strings straight from
// form inputs. Capped well above any realistic manual entry to reject garbage.
const rupees = z.coerce
  .number({ message: "Enter a valid amount" })
  .int("Enter a whole rupee amount")
  .min(0, "Amount can't be negative")
  .max(100_000_000, "That amount looks too large")

const positiveRupees = rupees.refine((n) => n > 0, "Enter an amount greater than 0")

// --- Onboarding (PRD 01 §6 Onboarding Screen) ---

export const onboardingSchema = z.object({
  userType: userTypeSchema,
  incomeType: incomeTypeSchema,
  coachingTone: coachingToneSchema,
  primaryGoal: z.string().trim().max(120).optional(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>

// --- Financial Setup line items (PRD 02 §3–§5) ---

export const fixedExpenseSchema = z.object({
  category: z.string().trim().min(1, "Name this expense").max(60),
  amount: positiveRupees,
  negotiability: negotiabilitySchema.default("non_negotiable"),
})

export const subscriptionSchema = z.object({
  name: z.string().trim().min(1, "Name this subscription").max(60),
  amount: positiveRupees,
  negotiability: negotiabilitySchema.default("semi_negotiable"),
})

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Give your goal a name").max(80),
  targetAmount: positiveRupees,
  currentSavings: rupees.default(0),
  // Accept an ISO date (YYYY-MM-DD) or omit. Kept as a string here; the API
  // converts to a Date so this schema stays serialisable across the wire.
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .optional(),
  priority: z.coerce.number().int().min(1).max(99).optional(),
  flexibility: goalFlexibilitySchema.default("flexible"),
  monthlyContribution: rupees.optional(),
})

export const debtSchema = z.object({
  type: debtTypeSchema,
  outstanding: positiveRupees,
  // Interest is an annual percentage (e.g. 36 for a 36% card). 0–200 guards typos.
  interestRate: z.coerce.number().min(0).max(200).optional(),
  minimumPayment: rupees.optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .optional(),
  lateFeeRisk: riskLevelSchema.optional(),
  stressLevel: riskLevelSchema.optional(),
})

// --- Full setup payload: one POST captures onboarding + the financial model ---
//
// goals require at least one entry — the product is goal-driven and PRD 01 §8
// makes "sets at least one goal" an acceptance criterion. Debts are optional
// (many users have none); the acceptance criterion is that they *can* add one,
// which the UI supports, not that a debt is mandatory.
export const financialSetupSchema = z.object({
  onboarding: onboardingSchema,
  income: z.object({
    monthlyAmount: positiveRupees,
    payday: z.coerce
      .number({ message: "Pick your payday" })
      .int()
      .min(1, "Payday must be 1–31")
      .max(31, "Payday must be 1–31"),
    plannedSavings: rupees.default(0),
  }),
  fixedExpenses: z.array(fixedExpenseSchema).max(50).default([]),
  subscriptions: z.array(subscriptionSchema).max(50).default([]),
  goals: z.array(goalSchema).min(1, "Add at least one goal").max(20),
  debts: z.array(debtSchema).max(20).default([]),
})

export type FinancialSetupInput = z.infer<typeof financialSetupSchema>
export type GoalInput = z.infer<typeof goalSchema>
export type DebtInput = z.infer<typeof debtSchema>
export type FixedExpenseInput = z.infer<typeof fixedExpenseSchema>
export type SubscriptionInput = z.infer<typeof subscriptionSchema>

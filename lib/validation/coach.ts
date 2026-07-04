import { z } from "zod"

import {
  debtTypeSchema,
  goalFlexibilitySchema,
  goalSchema,
  riskLevelSchema,
} from "./financial-model"

// Milestone 4 — Goal & Debt Coach validation (PRD 04). Shared client+server, and
// kept free of @prisma/client so it's importable from client forms. Create
// schemas reuse the Milestone 2 goal/debt shapes; update schemas are all-optional
// (PATCH) and carry no defaults, so an omitted field never overwrites a stored
// value.

// Mirrors the Prisma GoalCategory enum (PRD 04 §2 goal type / §3 ordering).
export const goalCategorySchema = z.enum([
  "emergency_fund",
  "essential_obligation",
  "time_bound",
  "lifestyle",
  "investing",
])

export type GoalCategoryValue = z.infer<typeof goalCategorySchema>

const rupees = z.coerce
  .number({ message: "Enter a valid amount" })
  .int("Enter a whole rupee amount")
  .min(0, "Amount can't be negative")
  .max(100_000_000, "That amount looks too large")

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")

// --- Goal create / update ---

// Create reuses the M2 goal shape (name, target, savings, deadline, priority,
// flexibility, monthlyContribution) plus the new optional category.
export const goalCreateSchema = goalSchema.extend({
  category: goalCategorySchema.optional(),
})

export const goalUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Give your goal a name").max(80),
    category: goalCategorySchema.nullable(),
    targetAmount: rupees.refine((n) => n > 0, "Enter an amount greater than 0"),
    currentSavings: rupees,
    deadline: isoDate.nullable(),
    priority: z.coerce.number().int().min(1).max(99).nullable(),
    flexibility: goalFlexibilitySchema,
    monthlyContribution: rupees.nullable(),
  })
  .partial()

// --- Debt create / update ---

export const debtCreateSchema = z.object({
  type: debtTypeSchema,
  outstanding: rupees.refine((n) => n > 0, "Enter an amount greater than 0"),
  interestRate: z.coerce.number().min(0).max(200).optional(),
  minimumPayment: rupees.optional(),
  dueDate: isoDate.optional(),
  lateFeeRisk: riskLevelSchema.optional(),
  stressLevel: riskLevelSchema.optional(),
})

export const debtUpdateSchema = z
  .object({
    type: debtTypeSchema,
    outstanding: rupees.refine((n) => n > 0, "Enter an amount greater than 0"),
    interestRate: z.coerce.number().min(0).max(200).nullable(),
    minimumPayment: rupees.nullable(),
    dueDate: isoDate.nullable(),
    lateFeeRisk: riskLevelSchema.nullable(),
    stressLevel: riskLevelSchema.nullable(),
  })
  .partial()

// --- Shared action record (PRD 04 §8; reused by M5/M6) ---

export const actionResponseSchema = z.enum(["done", "skipped", "remind_later"])

// `category` is an open string (M5 adds nudge categories) but bounded so it can't
// be used to store junk. actionKey + label identify and describe the action.
export const actionRecordSchema = z.object({
  category: z.string().trim().min(1).max(40),
  actionKey: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(300),
  response: actionResponseSchema,
  goalId: z.string().trim().max(40).optional(),
  debtId: z.string().trim().max(40).optional(),
})

export type GoalCreateInput = z.infer<typeof goalCreateSchema>
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>
export type DebtCreateInput = z.infer<typeof debtCreateSchema>
export type DebtUpdateInput = z.infer<typeof debtUpdateSchema>
export type ActionRecordInput = z.infer<typeof actionRecordSchema>

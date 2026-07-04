import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { fail, ok, parseBody } from "@/lib/http"
import { goalUpdateSchema } from "@/lib/validation/coach"

// Milestone 4 — edit / delete a goal (PRD 04 §2). Ownership is enforced by
// scoping every write to `{ id, userId }`, so a user can never touch another
// user's goal even by guessing an id.

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const parsed = await parseBody(req, goalUpdateSchema)
  if (!parsed.ok) return parsed.response
  const d = parsed.data

  // Only copy fields that were actually sent, so an omitted field keeps its
  // stored value while an explicit null clears it.
  const data: Prisma.GoalUpdateInput = {}
  if (d.name !== undefined) data.name = d.name
  if (d.category !== undefined) data.category = d.category
  if (d.targetAmount !== undefined) data.targetAmount = d.targetAmount
  if (d.currentSavings !== undefined) data.currentSavings = d.currentSavings
  if (d.deadline !== undefined) data.deadline = d.deadline ? toDate(d.deadline) : null
  if (d.priority !== undefined) data.priority = d.priority
  if (d.flexibility !== undefined) data.flexibility = d.flexibility
  if (d.monthlyContribution !== undefined) data.monthlyContribution = d.monthlyContribution

  const result = await prisma.goal.updateMany({ where: { id: params.id, userId: user.id }, data })
  if (result.count === 0) return fail("Goal not found.", 404)

  return ok()
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const result = await prisma.goal.deleteMany({ where: { id: params.id, userId: user.id } })
  if (result.count === 0) return fail("Goal not found.", 404)

  return ok()
}

import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { fail, ok, parseBody } from "@/lib/http"
import { debtUpdateSchema } from "@/lib/validation/coach"

// Milestone 4 — edit / delete a debt item (PRD 04 §4). Every write is scoped to
// `{ id, userId }` so ownership can't be bypassed by guessing an id.

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const parsed = await parseBody(req, debtUpdateSchema)
  if (!parsed.ok) return parsed.response
  const d = parsed.data

  const data: Prisma.DebtUpdateInput = {}
  if (d.type !== undefined) data.type = d.type
  if (d.outstanding !== undefined) data.outstanding = d.outstanding
  if (d.interestRate !== undefined) data.interestRate = d.interestRate
  if (d.minimumPayment !== undefined) data.minimumPayment = d.minimumPayment
  if (d.dueDate !== undefined) data.dueDate = d.dueDate ? toDate(d.dueDate) : null
  if (d.lateFeeRisk !== undefined) data.lateFeeRisk = d.lateFeeRisk
  if (d.stressLevel !== undefined) data.stressLevel = d.stressLevel

  const result = await prisma.debt.updateMany({ where: { id: params.id, userId: user.id }, data })
  if (result.count === 0) return fail("Debt not found.", 404)

  return ok()
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const result = await prisma.debt.deleteMany({ where: { id: params.id, userId: user.id } })
  if (result.count === 0) return fail("Debt not found.", 404)

  return ok()
}

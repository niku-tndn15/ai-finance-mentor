import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { fail, ok, parseBody } from "@/lib/http"
import { debtCreateSchema } from "@/lib/validation/coach"

// Milestone 4 — create a debt item (PRD 04 §4). The /goals server component
// reads debts directly via Prisma, so this route only handles the write.

function toDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const parsed = await parseBody(req, debtCreateSchema)
  if (!parsed.ok) return parsed.response

  const d = parsed.data
  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      type: d.type,
      outstanding: d.outstanding,
      interestRate: d.interestRate,
      minimumPayment: d.minimumPayment,
      dueDate: toDate(d.dueDate),
      lateFeeRisk: d.lateFeeRisk,
      stressLevel: d.stressLevel,
    },
  })

  return ok({ id: debt.id })
}

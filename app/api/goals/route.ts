import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { fail, ok, parseBody } from "@/lib/http"
import { goalCreateSchema } from "@/lib/validation/coach"

// Milestone 4 — create a goal (PRD 04 §2). Belongs to the current user. The
// list/read path is the /goals server component (loads via Prisma directly), so
// this route only handles the write.

function toDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const parsed = await parseBody(req, goalCreateSchema)
  if (!parsed.ok) return parsed.response

  const g = parsed.data
  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: g.name,
      category: g.category,
      targetAmount: g.targetAmount,
      currentSavings: g.currentSavings,
      deadline: toDate(g.deadline),
      priority: g.priority,
      flexibility: g.flexibility,
      monthlyContribution: g.monthlyContribution,
    },
  })

  return ok({ id: goal.id })
}

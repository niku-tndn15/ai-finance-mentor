import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { fail, ok, parseBody } from "@/lib/http"
import { actionRecordSchema } from "@/lib/validation/coach"

// Milestone 4 — shared action storage (IMPLEMENTATION_PLAN.md M4: "one storage
// schema", reused by the nudge engine (M5) and habit loop (M6)). Records a single
// Done / Skip / Remind-me-later response. Append-only: each response is its own
// row so M6 can see repeated patterns over time (PRD 06 §2).

// How far out a "Remind me later" pushes the action. One day keeps it a genuine
// nudge rather than a silent dismissal (PRD 04 §8 / PRD 05 §6).
const REMIND_LATER_MS = 24 * 60 * 60 * 1000

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const parsed = await parseBody(req, actionRecordSchema)
  if (!parsed.ok) return parsed.response

  const { category, actionKey, label, response, goalId, debtId } = parsed.data
  const remindAt = response === "remind_later" ? new Date(Date.now() + REMIND_LATER_MS) : null

  await prisma.actionRecord.create({
    data: { userId: user.id, category, actionKey, label, response, remindAt, goalId, debtId },
  })

  return ok()
}

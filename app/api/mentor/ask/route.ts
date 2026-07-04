import { getCurrentUser } from "@/lib/auth/session"
import { fail, ok, parseBody } from "@/lib/http"
import { mentorAskSchema } from "@/lib/validation/mentor"
import { answerMentor } from "@/lib/mentor"

// Milestone 7 — the conversational mentor endpoint (PRD 07 §1). Answers are
// grounded in the user's real financial model; answerMentor never throws and
// always returns a real, safe reply (deterministic base if AI is off/fails).

export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const parsed = await parseBody(req, mentorAskSchema)
  if (!parsed.ok) return parsed.response

  const result = await answerMentor(user.id, parsed.data.question)
  return ok(result)
}

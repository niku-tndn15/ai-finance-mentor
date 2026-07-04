import { fail, ok } from "@/lib/http"
import { generateDailyNudges } from "@/lib/nudge/persist"

// Milestone 5 — endpoint the Netlify scheduled function calls once a day to
// pre-generate every user's daily nudge (IMPLEMENTATION_PLAN.md M5). Not a
// user-facing route: it's gated by a shared secret (CRON_SECRET) rather than a
// session, because the cron caller has no cookie.

export const dynamic = "force-dynamic"
export const maxDuration = 60

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail closed if misconfigured
  const header = req.headers.get("authorization") || req.headers.get("x-cron-secret") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : header
  return token === secret
}

export async function POST(req: Request) {
  if (!authorized(req)) return fail("Not authorized.", 401)

  const result = await generateDailyNudges()
  return ok(result)
}

import { fail, ok } from "@/lib/http"
import { generateWeeklyReflections } from "@/lib/reflection/persist"

// Milestone 8 — endpoint the Netlify weekly scheduled function calls to
// pre-generate every user's weekly reflection. Gated by the shared CRON_SECRET
// (the cron caller has no session cookie), same pattern as the daily nudge.

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

  const result = await generateWeeklyReflections()
  return ok(result)
}

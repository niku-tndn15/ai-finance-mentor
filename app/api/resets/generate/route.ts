import { fail, ok } from "@/lib/http"
import { generateMonthlyResets } from "@/lib/reset"

// Milestone 8 — endpoint the Netlify monthly scheduled function calls to
// pre-generate every user's monthly reset. Gated by the shared CRON_SECRET (the
// cron caller has no session cookie), same pattern as the weekly reflection.

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

  const result = await generateMonthlyResets()
  return ok(result)
}

import { destroyCurrentSession } from "@/lib/auth/session"
import { ok } from "@/lib/http"

// Logout (IMPLEMENTATION_PLAN.md M1). Deletes the Session row and clears the
// cookie — instant server-side revocation (TECH_STACK.md §4.4).
export async function POST() {
  await destroyCurrentSession()
  return ok({ redirect: "/login" })
}

// Milestone 8 — Netlify Scheduled Function (TECH_STACK.md §2 / IMPLEMENTATION_PLAN
// M8 monthly reset). Runs monthly and asks the app to refresh every user's
// monthly reset. It holds no DB/Prisma logic — it calls the secret-gated app
// route, keeping the real work in the Next.js runtime where Prisma is bundled.

export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL
  const secret = process.env.CRON_SECRET
  if (!base || !secret) {
    return new Response("monthly-reset: URL or CRON_SECRET not configured", { status: 500 })
  }

  const res = await fetch(`${base}/api/resets/generate`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  })
  const body = await res.text()
  return new Response(`monthly-reset: ${res.status} ${body}`, { status: res.ok ? 200 : 502 })
}

// 1st of every month at 09:00 UTC — start-of-month planning check-in.
export const config = { schedule: "0 9 1 * *" }

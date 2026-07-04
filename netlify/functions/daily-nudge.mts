// Milestone 5 — Netlify Scheduled Function (TECH_STACK.md §2 / IMPLEMENTATION_PLAN
// M5). Runs once a day and asks the app to refresh every user's daily nudge. It
// holds no DB/Prisma logic itself — it just calls the secret-gated app route, so
// all the real work stays in the Next.js runtime where Prisma is bundled.

export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL
  const secret = process.env.CRON_SECRET
  if (!base || !secret) {
    return new Response("daily-nudge: URL or CRON_SECRET not configured", { status: 500 })
  }

  const res = await fetch(`${base}/api/nudges/generate`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  })
  const body = await res.text()
  return new Response(`daily-nudge: ${res.status} ${body}`, { status: res.ok ? 200 : 502 })
}

// "@daily" = 00:00 UTC each day. Netlify reads this export to register the cron.
export const config = { schedule: "@daily" }

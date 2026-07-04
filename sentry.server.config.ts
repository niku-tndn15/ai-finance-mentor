import * as Sentry from "@sentry/nextjs"

// Milestone 0 skeleton: no-ops until NEXT_PUBLIC_SENTRY_DSN is set (Netlify UI in prod,
// .env.local locally). See IMPLEMENTATION_PLAN.md Milestone 0.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
})

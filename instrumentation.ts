import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

// Capture errors thrown in server components, route handlers, and other
// server-side code so nothing the user never sees goes unreported (PRD 09 §7 —
// "cross-check Sentry is catching what the user doesn't see"). Without this hook
// those errors surface as a generic 500 / error boundary but never reach Sentry.
export const onRequestError = Sentry.captureRequestError

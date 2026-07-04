"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

// App-segment error boundary (PRD 09 §7). If a page in the app surface throws, the
// user sees a calm, plain-language message and a retry button — never a raw error
// or stack trace — while the root layout (disclaimer footer) stays intact. The
// error is reported to Sentry so we see what the user doesn't.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-lg font-semibold text-text-primary">Something went wrong</h1>
      <p className="max-w-xs text-sm text-text-muted">
        We couldn&apos;t load this just now. This has been reported — please try again.
      </p>
      <Button onClick={reset} className="mt-1">
        Try again
      </Button>
    </div>
  )
}

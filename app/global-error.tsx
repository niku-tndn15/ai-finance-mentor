"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-bg-base p-6 text-center">
        <h1 className="text-lg font-semibold text-text-primary">
          Something went wrong
        </h1>
        <p className="max-w-xs text-sm text-text-muted">
          UrPaisa hit an unexpected error. This has been reported — please try
          again.
        </p>
      </body>
    </html>
  )
}

import Link from "next/link"

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-surface-card px-4 py-3 text-center">
      <p className="text-xs leading-relaxed text-text-muted">
        UrPaisa gives educational money guidance based on the information you
        provide. It is not a financial advisor and does not provide
        investment, tax, legal, or credit advice.{" "}
        <Link href="/legal" className="underline underline-offset-2">
          Learn more
        </Link>
      </p>
    </footer>
  )
}

import Link from "next/link"

export const metadata = {
  title: "Legal & Disclaimers — UrPaisa",
}

export default function LegalPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-sm text-mentor-blue">
        ← Back
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-text-primary">
          Legal &amp; Disclaimers
        </h1>
        <p className="text-sm leading-relaxed text-text-primary">
          UrPaisa gives educational money guidance based on the information
          you provide. It is not a financial advisor and does not provide
          investment, tax, legal, or credit advice.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-card p-4">
        <h2 className="text-sm font-semibold text-text-primary">
          Estimates, not guarantees
        </h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Safe-to-use money, goal progress, and every recommendation in
          UrPaisa are estimates based on what you shared — not a guarantee of
          your actual financial position.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-card p-4">
        <h2 className="text-sm font-semibold text-text-primary">
          When to talk to a professional
        </h2>
        <p className="text-sm leading-relaxed text-text-muted">
          For investment, tax, legal, or credit decisions, or if you are
          facing serious financial or debt stress, please contact a qualified
          professional. UrPaisa does not replace that guidance.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-card p-4">
        <h2 className="text-sm font-semibold text-text-primary">
          What we collect
        </h2>
        <p className="text-sm leading-relaxed text-text-muted">
          UrPaisa only collects what you enter yourself — no bank account
          credentials, UPI credentials, card numbers, other account
          passwords, or credit score pulls are ever requested.
        </p>
      </div>
    </main>
  )
}

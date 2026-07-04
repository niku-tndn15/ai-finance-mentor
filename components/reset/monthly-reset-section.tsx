import { Sparkles, Wallet } from "lucide-react"
import type { MonthlyReset } from "@prisma/client"

import { Card, CardContent } from "@/components/ui/card"
import { RecordAction } from "@/components/actions/record-action"

// Milestone 8 — the monthly reset section on /review (PRD 08 §3). Renders the six
// reset questions answered from manual inputs + nudge history, the safe-to-use
// money for next month (consistent with M3), and one recommended change wired to
// the shared M4 action buttons. Understandable without charts (§7).

function formatRupees(amount: number) {
  const abs = Math.abs(amount).toLocaleString("en-IN")
  return amount < 0 ? `-₹${abs}` : `₹${abs}`
}

function ResetRow({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-text-muted">{question}</span>
      <span className="text-sm text-text-primary">{answer}</span>
    </div>
  )
}

export function MonthlyResetSection({ reset }: { reset: MonthlyReset }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text-primary">Your Month in Money</h2>

      <p className="text-sm text-text-primary">{reset.summary}</p>

      {/* Safe-to-use money for next month — the headline planning number (§3). */}
      <Card className="border-transparent bg-mentor-blue-bg">
        <CardContent className="gap-1">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-mentor-blue" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide text-mentor-blue">
              Safe to use next month
            </span>
          </div>
          <span className="text-2xl font-bold text-text-primary">
            {formatRupees(reset.safeToUseNextMonth)}
          </span>
          <p className="text-sm text-text-muted">{reset.safeToUseSummary}</p>
        </CardContent>
      </Card>

      {/* The six §3 questions. */}
      <Card>
        <CardContent className="gap-3">
          <ResetRow question="Did I overspend?" answer={reset.overspend} />
          <ResetRow question="Did I save enough?" answer={reset.savings} />
          <ResetRow question="What hurt most?" answer={reset.biggestLeak} />
          <ResetRow question="Which goal moved forward?" answer={reset.goalMovement} />
        </CardContent>
      </Card>

      {/* What to change next month, with the shared Done/Skip/Remind buttons. */}
      <Card>
        <CardContent className="gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-mentor-blue">
            Change for next month
          </span>
          <p className="text-base font-medium text-text-primary">{reset.changeNextMonth}</p>
          <RecordAction
            category={reset.nextActionCategory}
            actionKey={reset.nextActionKey}
            label={reset.nextAction}
          />
        </CardContent>
      </Card>

      {reset.aiPhrased && (
        <p className="flex items-center gap-1 px-1 text-xs text-text-muted">
          <Sparkles className="size-3" aria-hidden /> Written for you based on your month.
        </p>
      )}
    </section>
  )
}

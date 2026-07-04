import Link from "next/link"
import { redirect } from "next/navigation"
import { Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SafeToUseCard } from "@/components/money/safe-to-use-card"
import { ZoneMeter } from "@/components/money/zone-meter"
import { ProtectedMoneyCard } from "@/components/money/protected-money-card"
import { LowConfidenceAlert } from "@/components/states/low-confidence-alert"
import { NegativeMoneyAlert } from "@/components/states/negative-money-alert"
import { TrackView } from "@/components/analytics/track-view"
import { EVENTS } from "@/lib/analytics/events"
import { getCurrentUser } from "@/lib/auth/session"
import { computeSafeToUse, loadFinancialModel } from "@/lib/financial-model"

// Safe-to-Use Money screen (PRD 01 §6 / PRD 03). Real, server-computed data:
// loads the user's financial model and runs the Milestone 3 engine. If setup
// hasn't happened yet there's nothing to compute, so we send them to onboarding.
export default async function ResultPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const model = await loadFinancialModel(user.id)
  if (!model) redirect("/onboarding")

  const safe = computeSafeToUse(model)

  function formatRupees(amount: number) {
    const abs = Math.abs(amount).toLocaleString("en-IN")
    return amount < 0 ? `-₹${abs}` : `₹${abs}`
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-6">
      <TrackView event={EVENTS.safeToUseViewed} />
      <SafeToUseCard amount={safe.monthlyAmount} confidence={safe.confidence} />

      {/* Plain-language monthly answer (§3). */}
      <p className="text-sm text-text-primary">{safe.summary}</p>

      <ZoneMeter zone={safe.zone} message={safe.zoneMessage} />

      {/* Negative/low handling (§6): calm message + one concrete action. */}
      {safe.lowMoneyGuidance && (
        <div className="flex flex-col gap-2">
          {safe.isNegative ? (
            <NegativeMoneyAlert message={safe.lowMoneyGuidance.message} />
          ) : (
            <LowConfidenceAlert message={safe.lowMoneyGuidance.message} />
          )}
          <Card>
            <CardContent className="flex-row items-start gap-3">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-mentor-blue" aria-hidden />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">Your best move today</span>
                <span className="text-sm text-text-muted">{safe.lowMoneyGuidance.action}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Required low-confidence disclaimer, exact wording (§7). */}
      {safe.disclaimer && <LowConfidenceAlert message={safe.disclaimer} />}

      {/* Safe daily / weekly spend (§3). */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="gap-1">
            <span className="text-xs text-text-muted">Safe daily spend</span>
            <span className="text-lg font-semibold text-text-primary">
              {formatRupees(safe.dailySafeSpend)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="gap-1">
            <span className="text-xs text-text-muted">Safe weekly spend</span>
            <span className="text-lg font-semibold text-text-primary">
              {formatRupees(safe.weeklySafeSpend)}
            </span>
          </CardContent>
        </Card>
      </div>

      {safe.weekendSafeSpend > 0 && (
        <p className="px-1 text-xs text-text-muted">
          Roughly {formatRupees(safe.weekendSafeSpend)} of that is safe for the weekend.
        </p>
      )}

      <ProtectedMoneyCard amount={safe.doNotTouch} />

      <div className="mt-auto">
        <Button asChild size="lg" className="w-full">
          <Link href="/home">Show my first money action</Link>
        </Button>
      </div>
    </main>
  )
}

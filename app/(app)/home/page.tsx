import Link from "next/link"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"

import { SafeToUseCard } from "@/components/money/safe-to-use-card"
import { ZoneMeter } from "@/components/money/zone-meter"
import { DailyNudgeCard } from "@/components/money/daily-nudge-card"
import { AskBox } from "@/components/coach/ask-box"
import { NegativeMoneyAlert } from "@/components/states/negative-money-alert"
import { LowConfidenceAlert } from "@/components/states/low-confidence-alert"
import { TrackView } from "@/components/analytics/track-view"
import { EVENTS } from "@/lib/analytics/events"
import { getCurrentUser } from "@/lib/auth/session"
import { computeSafeToUse, loadFinancialModel } from "@/lib/financial-model"
import { getOrCreateTodayNudge } from "@/lib/nudge/persist"

// Daily Mentor screen (PRD 01 §6 / PRD 05 §6 plan). Real, server-computed: the
// M3 safe-to-use meter + the single M5 daily nudge (one primary action/day) with
// its Done/Skip/Remind-later buttons, plus the "Ask UrPaisa" entry point (the
// full mentor chat is Milestone 7).
export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const model = await loadFinancialModel(user.id)
  if (!model) redirect("/onboarding")

  const safe = computeSafeToUse(model)
  const nudge = await getOrCreateTodayNudge(user.id)

  function formatRupees(amount: number) {
    const abs = Math.abs(amount).toLocaleString("en-IN")
    return amount < 0 ? `-₹${abs}` : `₹${abs}`
  }

  return (
    <div className="flex flex-col gap-4">
      <TrackView event={EVENTS.safeToUseViewed} />
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Good day</h1>
        <Link href="/account" aria-label="Account settings" className="text-text-muted">
          <Settings className="size-5" aria-hidden />
        </Link>
      </div>

      <SafeToUseCard amount={safe.monthlyAmount} confidence={safe.confidence} />

      {!safe.isNegative && (
        <p className="text-sm text-text-muted">
          {formatRupees(safe.dailySafeSpend)} safe per day until next payday
        </p>
      )}

      <ZoneMeter zone={safe.zone} message={safe.zoneMessage} />

      {safe.isNegative && safe.lowMoneyGuidance && (
        <NegativeMoneyAlert message={safe.lowMoneyGuidance.message} />
      )}

      {safe.disclaimer && <LowConfidenceAlert message={safe.disclaimer} />}

      {nudge && <DailyNudgeCard nudge={nudge} />}

      <AskBox />
    </div>
  )
}

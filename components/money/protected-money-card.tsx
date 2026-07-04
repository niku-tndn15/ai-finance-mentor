import { Lock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function ProtectedMoneyCard({ amount }: { amount: number }) {
  return (
    <Card className="bg-zone-locked-bg border-transparent">
      <CardContent className="flex-row items-center gap-3">
        <Lock className="size-5 shrink-0 text-zone-locked" aria-hidden />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zone-locked">
            ₹{amount.toLocaleString("en-IN")} protected
          </span>
          <span className="text-xs text-zone-locked/80">
            Reserved for bills, debt, and savings — not safe to spend.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

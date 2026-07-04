"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UrgencyBadge } from "@/components/goals/urgency-badge"
import { DEBT_TYPE_LABEL } from "@/lib/coach"
import { sendJson } from "@/lib/client/api"
import { DebtForm } from "./debt-form"
import type { DebtDTO } from "./types"

// Milestone 4 — a single debt with its urgency (PRD 04 §5) and inline
// edit/delete. Delete refreshes the server component so urgency ordering and the
// recommendation recompute.
export function DebtCard({ debt }: { debt: DebtDTO }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (editing) {
    return <DebtForm debt={debt} onDone={() => setEditing(false)} />
  }

  async function remove() {
    if (deleting) return
    setDeleting(true)
    const res = await sendJson("DELETE", `/api/debts/${debt.id}`)
    if (res.ok) {
      router.refresh()
    } else {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>{DEBT_TYPE_LABEL[debt.type]}</CardTitle>
        <UrgencyBadge level={debt.urgency} />
      </CardHeader>
      <CardContent className="gap-1">
        <p className="text-lg font-semibold text-text-primary">
          ₹{debt.outstanding.toLocaleString("en-IN")} outstanding
        </p>
        <p className="text-sm text-text-muted">{describeDebt(debt)}</p>
        {debt.reasons.length > 0 && (
          <p className="text-xs text-text-muted">Why: {debt.reasons.join(", ")}.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} disabled={deleting}>
          <Trash2 /> {deleting ? "Removing…" : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  )
}

// A short factual line: interest and/or when it's due. No advice here — the one
// recommended action lives in the recommendation card (PRD 04 §8).
function describeDebt(debt: DebtDTO): string {
  const parts: string[] = []
  if (debt.interestRate != null) parts.push(`${debt.interestRate}% interest`)
  if (debt.daysUntilDue != null) {
    if (debt.daysUntilDue < 0) parts.push("payment overdue")
    else if (debt.daysUntilDue === 0) parts.push("due today")
    else parts.push(`due in ${debt.daysUntilDue} day${debt.daysUntilDue === 1 ? "" : "s"}`)
  }
  if (debt.minimumPayment != null) parts.push(`min ₹${debt.minimumPayment.toLocaleString("en-IN")}`)
  return parts.length > 0 ? parts.join(" · ") : "No due date or interest set"
}

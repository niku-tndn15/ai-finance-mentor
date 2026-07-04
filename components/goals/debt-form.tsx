"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DEBT_TYPE_LABEL, type DebtTypeValue, type RiskLevelValue } from "@/lib/coach"
import { sendJson } from "@/lib/client/api"
import type { DebtDTO } from "./types"

// Milestone 4 — add / edit a debt item (PRD 04 §4). One form for both, same
// create-vs-edit convention as GoalForm.

const TYPE_OPTIONS = Object.entries(DEBT_TYPE_LABEL) as [DebtTypeValue, string][]
const RISK_OPTIONS: [RiskLevelValue, string][] = [
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"],
]

export function DebtForm({ debt, onDone }: { debt?: DebtDTO; onDone: () => void }) {
  const router = useRouter()
  const isEdit = !!debt

  const [type, setType] = useState<DebtTypeValue>(debt?.type ?? "credit_card")
  const [outstanding, setOutstanding] = useState(debt ? String(debt.outstanding) : "")
  const [interestRate, setInterestRate] = useState(debt?.interestRate != null ? String(debt.interestRate) : "")
  const [minimumPayment, setMinimumPayment] = useState(
    debt?.minimumPayment != null ? String(debt.minimumPayment) : ""
  )
  const [dueDate, setDueDate] = useState(debt?.dueDate ?? "")
  const [lateFeeRisk, setLateFeeRisk] = useState<string>(debt?.lateFeeRisk ?? "")
  const [stressLevel, setStressLevel] = useState<string>(debt?.stressLevel ?? "")

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)

    const body: Record<string, unknown> = { type, outstanding }
    body.interestRate = interestRate === "" ? (isEdit ? null : undefined) : interestRate
    body.minimumPayment = minimumPayment === "" ? (isEdit ? null : undefined) : minimumPayment
    body.dueDate = dueDate === "" ? (isEdit ? null : undefined) : dueDate
    body.lateFeeRisk = lateFeeRisk === "" ? (isEdit ? null : undefined) : lateFeeRisk
    body.stressLevel = stressLevel === "" ? (isEdit ? null : undefined) : stressLevel

    const res = isEdit
      ? await sendJson("PATCH", `/api/debts/${debt!.id}`, body)
      : await sendJson("POST", "/api/debts", body)

    setSaving(false)
    if (!res.ok) {
      setError(res.error ?? "Couldn't save this debt. Please try again.")
      return
    }
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-card p-4">
      <Field label="Debt type">
        <Select value={type} onChange={(e) => setType(e.target.value as DebtTypeValue)}>
          {TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Outstanding (₹)">
          <Input
            type="number"
            inputMode="numeric"
            value={outstanding}
            onChange={(e) => setOutstanding(e.target.value)}
            placeholder="24000"
            required
          />
        </Field>
        <Field label="Interest rate % (optional)">
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="36"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Min. payment (optional)">
          <Input
            type="number"
            inputMode="numeric"
            value={minimumPayment}
            onChange={(e) => setMinimumPayment(e.target.value)}
            placeholder="2000"
          />
        </Field>
        <Field label="Due date (optional)">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Late fee risk (optional)">
          <Select value={lateFeeRisk} onChange={(e) => setLateFeeRisk(e.target.value)}>
            <option value="">Not sure</option>
            {RISK_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="How stressful (optional)">
          <Select value={stressLevel} onChange={(e) => setStressLevel(e.target.value)}>
            <option value="">Not sure</option>
            {RISK_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error && <p className="text-sm text-zone-red">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add debt"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { StepDots } from "@/components/onboarding/step-dots"
import { MascotBubble } from "@/components/mascot/mascot-bubble"
import { ordinal } from "@/lib/utils"
import { postJson } from "@/lib/client/api"
import { capture, EVENTS } from "@/lib/analytics/events"
import { clearOnboardingDraft, readOnboardingDraft } from "@/lib/onboarding-draft"
import { financialSetupSchema } from "@/lib/validation/financial-model"
import type { DebtTypeValue, NegotiabilityValue } from "@/lib/validation/financial-model"

// PRD 01 §6 Financial Setup inputs: income + payday, fixed expenses, subscriptions,
// simple debt, primary goal, planned savings. (No "Investments" step — PRD 02 has
// no investment entity, so adding one would break the plan's traceability rule.)
const stepLabels = ["Income", "Expenses", "Subscriptions", "Debt", "Goal", "Savings"]

const stepQuestions = [
  "What's your monthly income, and when does payday usually land?",
  "What are your fixed monthly expenses? Rent, EMIs, bills — whatever's must-pay.",
  "Any subscriptions you pay for? Streaming, apps, memberships. Skip if none.",
  "Any debt I should know about? This helps me figure out what to prioritize. Skip if none.",
  "What's the one goal you're saving toward right now?",
  "How much would you like to save each month, if things go well?",
]

const paydayOptions = Array.from({ length: 31 }, (_, i) => i + 1)

const presetExpenseCategories = ["Rent", "EMI", "Bills", "Insurance", "Family support"]

const debtTypeOptions: { label: string; value: DebtTypeValue }[] = [
  { label: "Credit card", value: "credit_card" },
  { label: "Personal loan", value: "personal_loan" },
  { label: "Education loan", value: "education_loan" },
  { label: "Vehicle loan", value: "vehicle_loan" },
  { label: "Buy now, pay later", value: "bnpl" },
  { label: "Borrowed from friends/family", value: "informal" },
  { label: "Other", value: "other" },
]

// Strip anything that isn't a digit ("₹ 45,000" → 45000). Empty/garbage → 0.
function parseMoney(value: string): number {
  const n = Number(value.replace(/[^\d]/g, ""))
  return Number.isFinite(n) ? n : 0
}

type ExpenseRow = { category: string; amount: string; negotiability: NegotiabilityValue }
type SubscriptionRow = { name: string; amount: string }

export default function SetupPage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefill the goal name from the onboarding primary goal (read once on mount).
  const draft = useMemo(() => readOnboardingDraft(), [])

  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [payday, setPayday] = useState("")
  const [plannedSavings, setPlannedSavings] = useState("")
  const [expenses, setExpenses] = useState<ExpenseRow[]>(
    presetExpenseCategories.map((category) => ({ category, amount: "", negotiability: "non_negotiable" }))
  )
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([])
  const [debtType, setDebtType] = useState<DebtTypeValue>("credit_card")
  const [debtOutstanding, setDebtOutstanding] = useState("")
  const [debtMinPayment, setDebtMinPayment] = useState("")
  const [debtInterest, setDebtInterest] = useState("")
  const [goalName, setGoalName] = useState(draft.primaryGoal ?? "")
  const [goalTarget, setGoalTarget] = useState("")
  const [goalCurrent, setGoalCurrent] = useState("")

  const isLast = stepIndex === stepLabels.length - 1

  // Per-step gating. Income and Goal are the only required steps; the rest
  // (expenses, subscriptions, debt) can be legitimately empty.
  const canContinue = (() => {
    if (stepIndex === 0) return parseMoney(monthlyAmount) > 0 && payday !== ""
    if (stepIndex === 4) return goalName.trim() !== "" && parseMoney(goalTarget) > 0
    return true
  })()

  function updateExpense(index: number, patch: Partial<ExpenseRow>) {
    setExpenses((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addSubscription() {
    setSubscriptions((prev) => [...prev, { name: "", amount: "" }])
  }
  function updateSubscription(index: number, patch: Partial<SubscriptionRow>) {
    setSubscriptions((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }
  function removeSubscription(index: number) {
    setSubscriptions((prev) => prev.filter((_, i) => i !== index))
  }

  async function submit() {
    setError(null)

    // Onboarding must have run first — the profile answers live in the draft.
    if (!draft.userType || !draft.incomeType || !draft.coachingTone) {
      router.push("/onboarding")
      return
    }

    const payload = {
      onboarding: {
        userType: draft.userType,
        incomeType: draft.incomeType,
        coachingTone: draft.coachingTone,
        primaryGoal: draft.primaryGoal,
      },
      income: {
        monthlyAmount: parseMoney(monthlyAmount),
        payday: Number(payday),
        plannedSavings: parseMoney(plannedSavings),
      },
      fixedExpenses: expenses
        .filter((e) => parseMoney(e.amount) > 0)
        .map((e) => ({ category: e.category, amount: parseMoney(e.amount), negotiability: e.negotiability })),
      subscriptions: subscriptions
        .filter((s) => s.name.trim() !== "" && parseMoney(s.amount) > 0)
        .map((s) => ({ name: s.name.trim(), amount: parseMoney(s.amount) })),
      goals: [
        {
          name: goalName.trim(),
          targetAmount: parseMoney(goalTarget),
          currentSavings: parseMoney(goalCurrent),
        },
      ],
      debts:
        parseMoney(debtOutstanding) > 0
          ? [
              {
                type: debtType,
                outstanding: parseMoney(debtOutstanding),
                minimumPayment: parseMoney(debtMinPayment) || undefined,
                interestRate: debtInterest.trim() !== "" ? Number(debtInterest) : undefined,
              },
            ]
          : [],
    }

    // Validate client-side against the same schema the server uses, so obvious
    // problems surface without a round-trip.
    const parsed = financialSetupSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setSubmitting(true)
    const res = await postJson<{ redirect?: string }>("/api/financial-model/setup", parsed.data)
    setSubmitting(false)

    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again.")
      return
    }

    // Activation metrics (PRD 00 §9): onboarding is complete, and setup always
    // includes at least one goal (schema requires it).
    capture(EVENTS.onboardingCompleted)
    if (parsed.data.goals.length > 0) capture(EVENTS.goalSet)

    clearOnboardingDraft()
    router.push(res.data.redirect ?? "/result")
  }

  function goNext() {
    if (!isLast) {
      setStepIndex((i) => i + 1)
    } else {
      void submit()
    }
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="text-text-muted disabled:opacity-0"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <StepDots total={stepLabels.length} current={stepIndex} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {stepLabels[stepIndex]}
        </span>
        <MascotBubble>{stepQuestions[stepIndex]}</MascotBubble>
      </div>

      {stepIndex === 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="income">Monthly income</Label>
            <Input
              id="income"
              inputMode="numeric"
              placeholder="₹ 45,000"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payday">Payday</Label>
            <div className="flex items-center gap-2">
              <Select
                id="payday"
                value={payday}
                onChange={(e) => setPayday(e.target.value)}
                className="flex-1"
              >
                <option value="" disabled>
                  Select day
                </option>
                {paydayOptions.map((day) => (
                  <option key={day} value={day}>
                    {ordinal(day)}
                  </option>
                ))}
              </Select>
              <span className="text-sm text-text-muted">of the month</span>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="flex flex-col gap-4">
          {expenses.map((row, index) => (
            <div key={row.category} className="flex flex-col gap-1.5">
              <Label htmlFor={`expense-${row.category}`}>{row.category}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`expense-${row.category}`}
                  inputMode="numeric"
                  placeholder="₹ 0"
                  className="flex-1"
                  value={row.amount}
                  onChange={(e) => updateExpense(index, { amount: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateExpense(index, {
                      negotiability:
                        row.negotiability === "non_negotiable" ? "semi_negotiable" : "non_negotiable",
                    })
                  }
                  className="whitespace-nowrap rounded-lg border border-border px-3 py-2 text-xs text-text-muted"
                >
                  {row.negotiability === "non_negotiable" ? "Must-pay" : "Flexible"}
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-text-muted">
            Tap the tag to mark an expense flexible (semi-negotiable) vs must-pay.
          </p>
        </div>
      )}

      {stepIndex === 2 && (
        <div className="flex flex-col gap-3">
          {subscriptions.map((row, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`sub-name-${index}`}>Name</Label>
                <Input
                  id={`sub-name-${index}`}
                  placeholder="e.g. Netflix"
                  value={row.name}
                  onChange={(e) => updateSubscription(index, { name: e.target.value })}
                />
              </div>
              <div className="flex w-28 flex-col gap-1.5">
                <Label htmlFor={`sub-amount-${index}`}>Amount</Label>
                <Input
                  id={`sub-amount-${index}`}
                  inputMode="numeric"
                  placeholder="₹ 0"
                  value={row.amount}
                  onChange={(e) => updateSubscription(index, { amount: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeSubscription(index)}
                className="mb-1.5 text-text-muted"
                aria-label="Remove subscription"
              >
                <X className="size-5" />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSubscription} className="w-full">
            <Plus className="mr-1 size-4" /> Add subscription
          </Button>
        </div>
      )}

      {stepIndex === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debt-type">Debt type</Label>
            <Select
              id="debt-type"
              value={debtType}
              onChange={(e) => setDebtType(e.target.value as DebtTypeValue)}
            >
              {debtTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debt-outstanding">Outstanding amount</Label>
            <Input
              id="debt-outstanding"
              inputMode="numeric"
              placeholder="₹ 0"
              value={debtOutstanding}
              onChange={(e) => setDebtOutstanding(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debt-min">Minimum payment (optional)</Label>
            <Input
              id="debt-min"
              inputMode="numeric"
              placeholder="₹ 0"
              value={debtMinPayment}
              onChange={(e) => setDebtMinPayment(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debt-interest">Interest rate % (optional)</Label>
            <Input
              id="debt-interest"
              inputMode="decimal"
              placeholder="e.g. 36"
              value={debtInterest}
              onChange={(e) => setDebtInterest(e.target.value)}
            />
          </div>
        </div>
      )}

      {stepIndex === 4 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input
              id="goal-name"
              placeholder="e.g. Emergency fund"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-target">Target amount</Label>
            <Input
              id="goal-target"
              inputMode="numeric"
              placeholder="₹ 0"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-current">Current savings</Label>
            <Input
              id="goal-current"
              inputMode="numeric"
              placeholder="₹ 0"
              value={goalCurrent}
              onChange={(e) => setGoalCurrent(e.target.value)}
            />
          </div>
        </div>
      )}

      {stepIndex === 5 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="planned-savings">Planned monthly savings</Label>
            <Input
              id="planned-savings"
              inputMode="numeric"
              placeholder="₹ 0"
              value={plannedSavings}
              onChange={(e) => setPlannedSavings(e.target.value)}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-text-muted">
        This helps UrPaisa estimate your safe to use money. You can edit it anytime.
      </p>

      {error && <p className="text-sm text-zone-red">{error}</p>}

      <div className="mt-auto">
        <Button className="w-full" size="lg" disabled={!canContinue || submitting} onClick={goNext}>
          {isLast ? (submitting ? "Saving…" : "See my safe-to-use money") : "Continue"}
        </Button>
      </div>
    </main>
  )
}

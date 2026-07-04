"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SelectableCard } from "@/components/onboarding/selectable-card"
import { StepDots } from "@/components/onboarding/step-dots"
import { MascotBubble } from "@/components/mascot/mascot-bubble"
import { goalOptions, pickTopGoal, type GoalOption } from "@/lib/goal-catalog"
import { saveSelectedGoals } from "@/lib/onboarding-store"
import { saveOnboardingDraft } from "@/lib/onboarding-draft"
import type {
  CoachingToneValue,
  IncomeTypeValue,
  UserTypeValue,
} from "@/lib/validation/financial-model"

// Options carry a friendly label and the enum value we persist (mirrors the
// Prisma enums via lib/validation/financial-model). Sets match PRD 01 §6.
const userTypeStep = {
  key: "userType" as const,
  question: "Which of these best describes you?",
  options: [
    { label: "Working professional", value: "working_professional" },
    { label: "Student with income", value: "student_with_income" },
    { label: "Freelancer / gig worker", value: "freelancer_gig" },
    { label: "Something else", value: "other" },
  ] satisfies { label: string; value: UserTypeValue }[],
}

const incomeTypeStep = {
  key: "incomeType" as const,
  question: "How would you describe your income?",
  options: [
    { label: "Fixed salary", value: "fixed_salary" },
    { label: "Variable income", value: "variable_income" },
    { label: "Mixed income", value: "mixed_income" },
  ] satisfies { label: string; value: IncomeTypeValue }[],
}

const coachingToneStep = {
  key: "coachingTone" as const,
  question: "Last one — how should I talk to you day to day?",
  options: [
    { label: "Friendly coach", value: "friendly" },
    { label: "Direct assistant", value: "direct" },
    { label: "Strict mentor", value: "strict" },
    { label: "Calm guide", value: "calm" },
    { label: "Motivational buddy", value: "motivational" },
  ] satisfies { label: string; value: CoachingToneValue }[],
}

const goalStepQuestion = "What are your money goals right now? Pick as many as apply."

// 4 steps total: userType, incomeType, goals (multi-select), coachingTone.
const totalSteps = 4
const goalStepIndex = 2

type Answers = {
  userType?: UserTypeValue
  incomeType?: IncomeTypeValue
  goals: GoalOption[]
  coachingTone?: CoachingToneValue
}

export default function OnboardingPage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({ goals: [] })

  const isGoalStep = stepIndex === goalStepIndex
  const singleStep =
    stepIndex === 0 ? userTypeStep : stepIndex === 1 ? incomeTypeStep : stepIndex === 3 ? coachingToneStep : undefined

  const canContinue = isGoalStep
    ? answers.goals.length > 0
    : Boolean(singleStep && answers[singleStep.key])

  function selectSingle(key: "userType" | "incomeType" | "coachingTone", value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  function toggleGoal(option: GoalOption) {
    setAnswers((prev) => ({
      ...prev,
      goals: prev.goals.includes(option)
        ? prev.goals.filter((g) => g !== option)
        : [...prev.goals, option],
    }))
  }

  function goNext() {
    if (stepIndex < totalSteps - 1) {
      setStepIndex((i) => i + 1)
      return
    }
    // Final step done — stash answers for the Financial Setup screen, which
    // submits everything together. Goal interests go to the separate store the
    // prototype home screen reads.
    saveSelectedGoals(answers.goals)
    saveOnboardingDraft({
      userType: answers.userType,
      incomeType: answers.incomeType,
      coachingTone: answers.coachingTone,
      primaryGoal: pickTopGoal(answers.goals),
    })
    router.push("/setup")
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
        <StepDots total={totalSteps} current={stepIndex} />
      </div>

      {isGoalStep ? (
        <>
          <MascotBubble>{goalStepQuestion}</MascotBubble>
          <div className="flex flex-col gap-2">
            {goalOptions.map((option) => (
              <SelectableCard
                key={option}
                label={option}
                selected={answers.goals.includes(option)}
                onSelect={() => toggleGoal(option)}
              />
            ))}
          </div>
        </>
      ) : (
        singleStep && (
          <>
            <MascotBubble>{singleStep.question}</MascotBubble>
            <div className="flex flex-col gap-2">
              {singleStep.options.map((option) => (
                <SelectableCard
                  key={option.value}
                  label={option.label}
                  selected={answers[singleStep.key] === option.value}
                  onSelect={() => selectSingle(singleStep.key, option.value)}
                />
              ))}
            </div>
          </>
        )
      )}

      <div className="mt-auto">
        <Button className="w-full" size="lg" disabled={!canContinue} onClick={goNext}>
          Continue
        </Button>
      </div>
    </main>
  )
}

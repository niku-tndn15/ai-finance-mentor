import { describe, expect, it } from "vitest"

import { computeHabitProfile } from "./compute"
import { selectTone } from "./tone"
import { buildWeeklyInsight } from "./insight"
import type { HabitActionInput } from "./types"

const AT = (hour: number) => new Date(2026, 6, 1, hour)

function rec(actionKey: string, response: HabitActionInput["response"], opts: { category?: string; createdAt?: Date } = {}): HabitActionInput {
  return { actionKey, category: opts.category ?? "", response, createdAt: opts.createdAt ?? AT(10) }
}

function times(n: number, r: HabitActionInput): HabitActionInput[] {
  return Array.from({ length: n }, () => ({ ...r }))
}

describe("compliance effects on readiness (§3)", () => {
  it("Done raises readiness, repeated Skip lowers it", () => {
    const done = computeHabitProfile(times(3, rec("goal-contribution:g1", "done")))
    const skipped = computeHabitProfile(times(3, rec("goal-contribution:g1", "skipped")))
    expect(done.readinessHints.goal!).toBeGreaterThan(0.6)
    expect(skipped.readinessHints.goal!).toBeLessThan(0.4)
  })

  it("Remind me later never counts as failure (no readiness, no suppression)", () => {
    const p = computeHabitProfile(times(3, rec("goal-contribution:g1", "remind_later")))
    expect(p.readinessHints.goal).toBeUndefined()
    expect(p.suppressedTypes).toHaveLength(0)
  })
})

describe("suppression of repeatedly-skipped soft types (§3)", () => {
  it("suppresses a soft saving type after repeated skips with no completions", () => {
    const p = computeHabitProfile(times(3, rec("goal-contribution:g1", "skipped")))
    expect(p.suppressedTypes).toContain("goal")
    expect(p.suppressedTypes).toContain("payday")
  })

  it("never suppresses an essential debt nudge, however often it's skipped", () => {
    const p = computeHabitProfile(times(5, rec("debt-due:d1", "skipped")))
    expect(p.suppressedTypes).not.toContain("debt")
  })
})

describe("saving family + smaller-ask (§5)", () => {
  it("aggregates payday and goal as one saving family", () => {
    const p = computeHabitProfile([rec("payday-save", "done"), rec("goal-contribution:g1", "done")])
    // Both saving types share the family readiness.
    expect(p.readinessHints.goal).toBe(p.readinessHints.payday)
  })

  it("prefers smaller saves when skips outnumber completions", () => {
    const p = computeHabitProfile([rec("goal-contribution:g1", "done"), ...times(2, rec("goal-contribution:g1", "skipped"))])
    expect(p.preferSmallerSaves).toBe(true)
  })
})

describe("subscription cleanup follow-up (§5)", () => {
  it("flags the cleanup and leans into small saves", () => {
    const p = computeHabitProfile([rec("subscription-cleanup", "done")])
    expect(p.subscriptionCleanupDone).toBe(true)
    expect(p.readinessHints.goal!).toBeGreaterThan(0)
  })
})

describe("time-of-day signal (§4)", () => {
  it("detects an evening actor from completion timestamps", () => {
    const p = computeHabitProfile(times(3, rec("safe-spend-day", "done", { createdAt: AT(20) })))
    expect(p.timeOfDay).toBe("evening")
  })
})

describe("adaptive tone (§6)", () => {
  it("respects the chosen tone when there's little data", () => {
    const p = computeHabitProfile([rec("goal-contribution:g1", "done")])
    expect(selectTone(p, "strict").tone).toBe("strict")
  })

  it("switches to motivational for someone who completes challenges", () => {
    const p = computeHabitProfile([...times(2, rec("impulse-24h", "done")), rec("debt-due:d1", "done")])
    expect(selectTone(p, "friendly").tone).toBe("motivational")
  })

  it("softens a firm tone that isn't landing instead of pushing harder", () => {
    const p = computeHabitProfile(times(4, rec("goal-contribution:g1", "skipped")))
    expect(selectTone(p, "strict").tone).toBe("calm")
  })
})

describe("weekly insight (§7, no formal score)", () => {
  it("asks for more activity when there isn't enough data", () => {
    expect(buildWeeklyInsight(computeHabitProfile([])).hasData).toBe(false)
  })

  it("summarises completions and adapts the focus line", () => {
    const p = computeHabitProfile([rec("goal-contribution:g1", "done"), ...times(2, rec("goal-contribution:g1", "skipped"))])
    const insight = buildWeeklyInsight(p)
    expect(insight.hasData).toBe(true)
    expect(insight.headline).toMatch(/completed 1 of 3/i)
    expect(insight.focus).toMatch(/smaller saving/i)
  })
})

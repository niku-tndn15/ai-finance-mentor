# UrPaisa Habit and AI Learning Loop PRD

## 1. Objective

Model the user's money habits and use every interaction to improve future recommendations.

UrPaisa should not only model money. It should model behavior.

## 2. Habit Model

UrPaisa learns across these dimensions:

### Saving Habit

Does the user save early after salary or only at month end?

### Spending Timing Habit

Does the user overspend right after payday?

### Subscription Discipline

Does the user review recurring expenses?

### Debt Discipline

Does the user pay on time?

### Goal Consistency

Does the user contribute regularly toward goals?

### Impulse Spending Pattern

Does the user spend more during weekends, sales, stress, or social outings?

### Nudge Response Pattern

Does the user respond better to friendly reminders, direct warnings, small challenges, or positive encouragement?

## 3. Action Compliance

Every nudge supports:

- Done.
- Skip.
- Remind me later.

Done:

- Saves completed action.
- Increases confidence in that action type.

Skip:

- Saves skipped action.
- Reduces future frequency if repeated.

Remind me later:

- Saves reminder time.
- Does not count as failure.

## 4. Learning Inputs

UrPaisa learns from:

- Done actions.
- Skipped actions.
- Delayed actions.
- Repeated questions.
- Spending changes.
- Goal progress.
- Bill payment behavior.
- Preferred coaching tone.
- Time of day when user acts.
- Types of nudges completed.

## 5. Adaptation Examples

If user skips "save INR 2,000" but completes "save INR 300":

- Recommend smaller saving actions first.

If user ignores morning nudges but acts at night:

- Shift nudge timing later.

If user completes debt nudges but skips investment nudges:

- Prioritize debt guidance.

If user completes subscription cleanup:

- Offer similar low-friction recurring savings actions.

## 6. Adaptive Tone

Tone options:

- Friendly coach.
- Direct assistant.
- Strict mentor.
- Calm guide.
- Motivational buddy.

Example friendly tone:

"You are doing okay, but let's slow spending a little this week."

Example direct tone:

"You are INR 2,000 over your safe spending pace. Reduce non-essential spending for 4 days."

## 7. Money Health Score

Money Health Score is an advanced but important product concept.

The score is based on behavior, not wealth.

Inputs:

- Savings consistency.
- Expense control.
- Debt repayment discipline.
- Emergency fund progress.
- Goal progress.
- Bill payment reliability.
- Safe-to-use money accuracy.
- Nudge completion rate.

Example:

"Your Money Health Score is 68 out of 100. Your strongest habit is paying bills on time. Your weakest habit is saving after payday."

MVP can show lightweight habit insights without a formal score. Full score can be Phase 2 or later.

## 8. Acceptance Criteria

- App stores Done, Skip, and Remind me later actions.
- App can identify repeated completed and skipped nudge types.
- App adapts future suggestions based on behavior.
- App supports selected tone in AI wording.
- App can produce weekly habit insight.


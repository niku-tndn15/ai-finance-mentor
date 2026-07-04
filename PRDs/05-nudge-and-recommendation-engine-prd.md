# UrPaisa Nudge and Recommendation Engine PRD

## 1. Objective

Recommend the next best financial action using the user's financial urgency, readiness, and expected impact.

Final output should feel like:

"Best next action: Move INR 500 to your emergency fund today because payday was yesterday and your spending has not started yet."

## 2. Recommendation Factors

### Financial Urgency

What needs attention first?

Examples:

- Bill due soon.
- Debt payment due.
- Low emergency fund.
- Overspending risk.
- Goal falling behind.

### User Readiness

What is the user likely to complete?

Examples:

- User completes small saving actions.
- User skips large sacrifice actions.
- User responds well to reminders.
- User prefers weekend planning.

### Expected Impact

Which action improves the user's financial situation most?

Examples:

- Paying credit card avoids fees.
- Saving early protects goals.
- Cancelling unused subscription creates recurring benefit.
- Reducing food delivery improves monthly cash flow.

## 3. Behavioral Nudge Types

### Payday Nudge

"Salary is in. Save before spending starts."

### Weekend Nudge

"You usually spend more on weekends. Keep INR 1,000 as your weekend limit."

### Subscription Nudge

"You have 3 recurring payments. Cancel one if you no longer use it."

### Goal Nudge

"You are close to your goal. Add INR 500 today to stay ahead."

### Debt Nudge

"Your credit card payment is due in 3 days. Paying now avoids late fees."

### Impulse Control Nudge

"Before buying this, wait 24 hours. If you still want it tomorrow, UrPaisa will help you check affordability."

## 4. Trigger Priority

Default priority:

1. Essential bill or debt due soon.
2. Emergency mode or low safe-to-use money.
3. Payday allocation.
4. High-interest debt payoff.
5. Goal falling behind.
6. Overspending risk.
7. Subscription cleanup.
8. Habit challenge.
9. General weekly safe-spend nudge.

## 5. Nudge Anatomy

Every nudge must include:

- Trigger.
- One clear action.
- Reason.
- Expected benefit.
- Done, Skip, Remind me later.

## 6. Frequency

MVP:

- One primary nudge per day.
- One weekly reflection.
- Reminders only when user chooses Remind me later.

Advanced:

- Time-of-day optimization.
- Contextual purchase-decision nudges.
- Emergency mode nudges.

## 7. AI Role

AI can:

- Convert the recommendation into friendly language.
- Adjust tone.
- Explain the tradeoff.
- Personalize with goal and debt context.

AI must not:

- Invent user data.
- Recommend specific investment products.
- Push credit products.
- Use shame or fear.

## 8. Acceptance Criteria

- Recommendation uses urgency, readiness, and impact.
- User receives one clear next action.
- Every recommendation has a reason.
- Nudge actions are stored.
- Fallback templates work if AI fails.


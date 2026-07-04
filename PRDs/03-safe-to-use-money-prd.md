# UrPaisa Safe-to-Use Money PRD

## 1. Objective

Help the user understand how much money they can safely spend without disturbing bills, savings, debts, and goals.

This replaces complex budgeting dashboards with a simple spending capacity answer.

## 2. Core Calculation

Basic version:

`Income - fixed expenses - planned savings = safe-to-use money`

Advanced version:

`Income - fixed expenses - goal commitments - debt payments - emergency buffer = safe-to-use money`

MVP should start with the basic version plus simple debt buffer and goal contribution inputs.

## 3. Required Outputs

UrPaisa should show:

- Safe-to-use money this month.
- Safe daily spend.
- Safe weekly spend.
- Safe weekend spend where relevant.
- Risk zone amount.
- Do-not-touch amount.

Example:

"You can safely use INR 9,500 this month without disturbing your bills, savings, and goals."

## 4. Safe Spend Meter

The app should include a simple meter with zones:

- Green: Safe.
- Yellow: Be careful.
- Red: Spending may hurt goals.
- Locked: Bills, debt, or savings money.

Example green copy:

"You are in the green zone. You can spend INR 750 today safely."

Example yellow copy:

"You are entering the yellow zone. Spending more than INR 1,200 today may affect your travel goal."

## 5. Risk Zone Logic

Green:

- User is within safe daily or weekly spending pace.

Yellow:

- User is close to exceeding safe pace.
- Extra spending may delay a goal or reduce buffer.

Red:

- User has exceeded safe pace.
- Extra spending likely affects bills, debt payment, or planned savings.

Locked:

- Money reserved for rent, bills, debt minimums, emergency buffer, or goal commitments.

## 6. Negative or Low Safe-to-Use Money

If safe-to-use money is low or negative:

- Use calm language.
- Show essentials-first guidance.
- Recommend one action such as reducing a semi-negotiable expense or adjusting timeline.

Example:

"Your must-pay money is higher than your current income plan. Let's protect essentials first and review one flexible expense today."

## 7. Confidence Levels

High confidence:

- Income, payday, fixed expenses, goals, and debts are entered.

Medium confidence:

- Income and fixed expenses are entered, but debt or goal details are incomplete.

Low confidence:

- Only income is entered or major costs are missing.

All low-confidence outputs must say:

"This is a rough estimate based on what you have entered."

## 8. Acceptance Criteria

- App calculates safe-to-use money from manual inputs.
- App shows safe daily and weekly spend.
- App shows zone status.
- App handles low or negative safe-to-use money.
- App explains the calculation in simple language.


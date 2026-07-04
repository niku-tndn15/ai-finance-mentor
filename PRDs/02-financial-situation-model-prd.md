# UrPaisa Financial Situation Model PRD

## 1. Objective

Build a living model of the user's financial life. This model powers safe-to-use money, goal guidance, debt guidance, nudges, and conversational answers.

## 2. Income Model

UrPaisa captures:

- Monthly income.
- Payday.
- Irregular income.
- Bonus or freelance income.
- Expected future income changes.
- Income stability level.

Income stability levels:

- High: fixed salary.
- Medium: salary plus occasional bonus or freelance income.
- Low: gig work, freelance work, irregular income.

Product implication:

- High stability users can receive stronger monthly allocation guidance.
- Low stability users need stronger emergency buffer and conservative safe-spend guidance.

## 3. Fixed Expense Model

UrPaisa captures must-pay expenses:

- Rent.
- EMIs.
- Insurance.
- Utilities.
- Phone bills.
- Internet.
- Tuition or loan payments.
- Family support.
- Subscriptions.
- Credit card minimum payments.

Each expense should be marked as:

- Non-negotiable.
- Semi-negotiable.

Examples:

- Rent is non-negotiable.
- A streaming subscription is semi-negotiable.

## 4. Goal Model

UrPaisa supports goals such as:

- Emergency fund.
- Debt repayment.
- Travel.
- New phone.
- Education.
- Wedding.
- Moving to a new city.
- Investing.
- Family support.
- Vehicle or house purchase.

Each goal has:

- Target amount.
- Deadline.
- Current savings.
- Priority level.
- Flexibility.
- Monthly contribution needed.

Example:

- Goal: Emergency fund.
- Target: INR 60,000.
- Current savings: INR 10,000.
- Timeline: 6 months.
- Required monthly saving: INR 8,333.

## 5. Debt Model

UrPaisa must not treat all debt equally.

Debt types:

- Credit card debt.
- Personal loan.
- Education loan.
- Vehicle loan.
- Buy now pay later dues.
- Informal borrowing from friends or family.

For each debt, track:

- Outstanding amount.
- Interest rate.
- Minimum payment.
- Due date.
- Late fee risk.
- Emotional stress level.

Debt guidance should help decide whether the user should:

- Save first.
- Pay debt first.
- Balance saving and debt repayment.

## 6. Spending Capacity Model

Basic safe-to-use calculation:

`Income - fixed expenses - planned savings = safe-to-use money`

Advanced safe-to-use calculation:

`Income - fixed expenses - goal commitments - debt payments - emergency buffer = safe-to-use money`

The model should support:

- Safe daily spend.
- Safe weekly spend.
- Safe weekend spend.
- Risk zone amount.
- Do-not-touch amount.

## 7. Model Outputs

The financial situation model outputs:

- Income predictability.
- Fixed commitment load.
- Goal commitment load.
- Debt urgency.
- Safe-to-use money.
- Current financial risk.
- Best next action candidate.

## 8. MVP Requirements

MVP must support:

- Monthly income.
- Payday.
- Basic fixed expenses.
- Basic subscriptions.
- One or more goals.
- One or more debt items.
- Planned savings.
- Safe-to-use money.

MVP can defer:

- Automatic transaction data.
- Full category-level actual spend.
- Advanced future income forecasting.


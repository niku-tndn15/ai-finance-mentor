# UrPaisa Data Privacy and AI Safety PRD

## 1. Objective

Protect user trust by making UrPaisa transparent, careful with financial data, and safe in how it uses AI.

## 2. Data Philosophy

UrPaisa should collect only the data needed to create useful financial guidance. The MVP should avoid sensitive integrations until trust and engagement are validated.

## 3. MVP Data Collected

Allowed:

- Name or nickname.
- User type.
- Income estimate.
- Payday.
- Income stability.
- Fixed expenses.
- Subscriptions.
- Goals.
- Debts.
- Planned savings.
- Coaching tone.
- Nudge responses.
- Money questions asked.

Not allowed in MVP:

- Bank account credentials.
- UPI credentials.
- Card numbers.
- Account passwords.
- Credit score pull.
- Brokerage or investment account access.

## 4. AI Safety Rules

AI may:

- Explain tradeoffs.
- Personalize nudges.
- Answer user money questions.
- Summarize weekly behavior.
- Suggest low-risk habits.
- Simulate simple what-if scenarios from user-entered data.

AI must not:

- Recommend specific stocks, funds, loans, cards, or insurance products.
- Promise returns.
- Claim certainty.
- Pretend to be a regulated financial advisor.
- Shame users.
- Push users toward credit or risky financial products.
- Invent data.

## 5. Disclaimer Language

App-level disclaimer:

"UrPaisa gives educational money guidance based on the information you provide. It is not a financial advisor and does not provide investment, tax, legal, or credit advice."

In-context disclaimer:

"This is an estimate based on your inputs."

## 6. Sensitive States

Emergency mode, job loss, debt stress, and low safe-to-use money require extra care.

Rules:

- Stay calm.
- Prioritize essentials.
- Avoid fear-based language.
- Recommend contacting qualified professionals where appropriate.
- Avoid giving legal, tax, or insolvency advice.

## 7. Failure Handling

If AI fails:

- Show a fallback nudge.
- Do not block the user journey.
- Do not expose raw technical errors.

If data is missing:

- State assumptions.
- Ask for one missing input.
- Keep recommendation conservative.

## 8. Acceptance Criteria

- MVP does not require bank linking.
- AI answers include safe boundaries.
- Financial guidance is framed as educational.
- User can understand when estimates are rough.
- Fallback content exists for AI failure.


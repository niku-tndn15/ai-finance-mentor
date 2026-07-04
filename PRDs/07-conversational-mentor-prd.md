# UrPaisa Conversational Mentor PRD

## 1. Objective

Allow users to ask natural-language money questions and receive answers grounded in their personal financial model.

The AI should not give generic advice. It should answer using the user's income, expenses, goals, debts, safe-to-use money, and habit history.

## 2. MVP Conversational Questions

MVP should support questions like:

- "How much should I save this week?"
- "What is the one thing I should fix first?"
- "Can I spend INR 4,000 on shopping today?"
- "Why am I not saving enough?"
- "Should I pay debt or save first?"
- "How do I reduce spending without feeling restricted?"

## 3. Advanced Conversational Questions

Advanced version should support:

- "Can I afford a trip next month?"
- "How do I pay off my debt faster?"
- "What should I do after salary comes?"
- "Should I cancel my gym membership?"
- "What happens if my rent increases?"
- "How many months until I reach my goal?"
- "What if I skip investing this month?"

## 4. Purchase Decision Assistant

Users can ask:

"Can I afford this?"

The answer should return:

- Safe to buy.
- Buy later.
- Buy in parts.
- Avoid for now.
- Cheaper alternative suggested, if appropriate.

Example:

User: "Can I spend INR 4,000 on shopping today?"

UrPaisa:

"You can, but it will push you into the yellow zone for the month. A safer limit is INR 2,200. If you spend INR 4,000, reduce eating out by INR 450 for the next 4 weeks."

Purchase decision assistant can be basic in MVP and richer in later phases.

## 5. AI Financial Twin

AI Financial Twin is the advanced simulation layer.

It answers:

- Can I afford this purchase?
- What happens if I save INR 2,000 extra this month?
- What happens if my rent increases?
- Can I take a trip next month?
- Should I pay debt or save first?
- How many months until I reach my goal?
- What if I skip investing this month?

Example:

User asks:

"Can I buy a INR 30,000 phone this month?"

UrPaisa replies:

"You can buy it, but it will reduce your emergency fund progress by 2 months. A safer option is to pay INR 10,000 now and save for the rest over 2 months."

AI Financial Twin is not required in full for MVP.

## 6. Answer Rules

Every answer should:

- Use the user's actual profile where available.
- State assumptions if data is missing.
- Explain the tradeoff.
- Recommend one next action.
- Avoid regulated financial advice.

Every answer should avoid:

- Specific investment products.
- Credit product selling.
- Fear-based language.
- Claims of certainty.
- Data that the user did not provide.

## 7. Fallback Behavior

If data is missing:

- Ask for one missing input.
- Give a rough answer only if safe.

Example:

"I can estimate this better if you add your credit card due date. For now, based on your safe-to-use money, INR 4,000 would likely move you into the yellow zone."

## 8. Acceptance Criteria

- User can ask a money question from the daily mentor screen.
- Answer references safe-to-use money, goals, or debt where relevant.
- Answer includes one clear recommendation.
- Missing data is handled transparently.
- AI safety rules are followed.


# UrPaisa Phase 1 Design Plan

This is the design elaboration of [Milestone 0.5 — Mobile First UX Prototype](IMPLEMENTATION_PLAN.md#milestone-05--mobile-first-ux-prototype). It turns the screens already specified in [01-mvp-experience-prd.md](PRDs/01-mvp-experience-prd.md) §6, [03-safe-to-use-money-prd.md](PRDs/03-safe-to-use-money-prd.md), and [04-goal-and-debt-coach-prd.md](PRDs/04-goal-and-debt-coach-prd.md) into a concrete visual design system, screen-by-screen spec, and prototype scope — **it does not add new product scope**. Where this doc and a PRD ever disagree, the PRD wins per [PRDs/README.md](PRDs/README.md) source-of-truth rule.

Output of this plan: a design system + a clickable mobile-first prototype (~375px viewport first) covering the full Phase 1 journey, built before Milestones 1–8 start real feature engineering.

---

## 1. Core Design Principle

**One screen. One number. One action. One next step.**

Every screen in this plan is checked against this before anything is added: if a piece of content or UI doesn't serve the one number/one action on that screen, it's cut or moved deeper (e.g. into Goals or Coach). This is the same rule as Product Build Principle 1 in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#product-build-principles).

The product should feel like a calm mobile app that happens to run on the web — not a banking dashboard, not a budgeting spreadsheet, not a trading app.

---

## 2. Visual Design System

### 2.1 Color tokens

| Token | Meaning | Use |
|---|---|---|
| `bg-base` | Soft off-white / light grey | App background |
| `surface-card` | White / near-white | Card backgrounds, rounded corners |
| `text-primary` | Dark charcoal | Body/heading text |
| `zone-green` | Emerald green | Safe money, "Done" state, green zone |
| `zone-yellow` | Amber / warm yellow | Caution, yellow zone |
| `zone-red` | Soft coral red (never harsh alert red) | Risk, red zone |
| `zone-locked` | Muted grey-blue | Locked / do-not-touch money |
| `mentor-blue` | Calm blue | AI mentor elements, guidance, Coach tab, chat bubbles |

Rules: no pure black, no saturated banking-red, no stock-market green/red pairing. Coral (risk) and emerald (safe) must be distinguishable for common color-vision deficiencies — pair color with icon/label always, never color alone.

### 2.2 Typography & layout

- One large, bold numeral per hero moment (safe-to-use amount) — this is the single most visually dominant element on Home and the Result screen.
- Generous whitespace; spacious padding inside cards (not edge-to-edge dense tables).
- Rounded corners on all cards (consistent radius token, e.g. `radius-lg`).
- Minimal charts only: a single progress bar or a simple zone meter — no multi-series graphs, no candlesticks, no dashboards with 4+ stats visible at once.

### 2.3 Tone of voice (applies to all copy in this doc)

Supportive money mentor, not a bank statement:
- "You can safely use ₹12,400 this month."
- "Your best money action today is to save ₹500."
- "You are close to the yellow zone. Keep spending light today."
- "This is an estimate based on what you shared."

Never: shame, fear, guilt, jargon, exclamation-heavy urgency, red alert-style banking language.

### 2.4 Mascot

A single character (`images/finance-me.png`) personifies the mentor voice, so the product reads as "someone coaching you" rather than a form. Two components carry this everywhere:

- **Mascot avatar** — circular crop of the character, cropped to the face. Sizes: `sm` (inline, next to a question), `lg` (Welcome screen intro).
- **Mascot speech bubble** — avatar + rounded speech-bubble (`mentor-blue-bg`, sharp top-left corner as the "tail") containing first-person mentor copy.

Used on: Welcome screen intro, and in place of the plain question heading on every Onboarding and Financial Setup step — the mascot "asks" each question rather than a static label doing so. Not used on Home/Goals/Coach/Habits/Review (those already carry the mentor voice through card copy and the "Ask UrPaisa" chat surface).

---

## 3. Information Architecture & Navigation

Bottom navigation, 5 tabs (Phase 1):

1. **Home** — Daily Mentor screen (default landing after onboarding)
2. **Goals** — Goals and debt screen
3. **Coach** — AI chat screen
4. **Habits** — lightweight: completed actions, skipped actions, most-completed nudge type, one habit insight. *No formal Money Health Score.*
5. **Review** — Weekly reflection

Onboarding → Setup → Result screens are a linear flow outside the tab bar (first-run only); the tab bar appears once the user lands on Home.

---

## 4. Screen Specs

### 4.1 Welcome Screen

- **Purpose:** introduce UrPaisa as a mentor, not a tracker.
- **Content:** Full-screen intro video of the mentor mascot (`public/videos/intro-video.mp4`), with only three things overlaid: brand "UrPaisa", tagline "Meet your AI money mentor", and CTA "Start my money plan" (jumps straight to Onboarding questions). All other copy is intentionally stripped for an immersive splash.
- **Design:** the video fills the screen (`object-cover`, constrained to the app's `max-w-md` column) and autoplays muted + inline + looping for a reliable, lively start; a single speaker toggle (top-right) turns the AI voice on (browsers block autoplay-with-sound). Overlaid brand/tagline/CTA sit over a bottom gradient scrim for legibility. The app-level legal disclaimer footer is covered on this splash (it remains visible on every subsequent screen, satisfying PRD 09 §5's "app-wide" requirement).
- **Maps to:** PRD 01 §6 Welcome Screen (copy reconciled — PRD's "Get started" vs. this plan's "Start my money plan" are equivalent; use this plan's wording as the Phase 1 copy source since it's more specific).

### 4.2 Onboarding Screen

- **Purpose:** collect user type, income type, goals, tone — without feeling like a form.
- **Fields (selectable cards/chips, not text inputs):**
  - User type: Student, Salaried, Freelancer, Business owner, Mixed income
  - Income type: Fixed, Variable, Irregular, Mixed
  - Goals (multi-select — select all that apply): Save more monthly, Build emergency fund, Pay off debt, Control spending, Plan a purchase, Start investing later, Travel savings. Recommendations are tailored across all selected goals, using the same default priority ordering as [04](PRDs/04-goal-and-debt-coach-prd.md) §3 (emergency fund → high-interest debt → essential obligations → time-bound goals → lifestyle → investing readiness) to pick which goal drives today's action.
  - Coaching tone: Friendly coach, Direct assistant, Strict mentor, Calm guide, Motivational buddy
- **Design:** one question per screen or a short paginated set, chip/card selection (large tap targets), progress dots, mascot speech bubble (§2.4) asking each question. The goals step allows multiple selections (checkmark per selected chip); every other step remains single-select.

### 4.3 Financial Setup Screen

- **Purpose:** capture the manual financial situation model (feeds [02-financial-situation-model-prd.md](PRDs/02-financial-situation-model-prd.md)).
- **Fields:** Monthly income · Payday (day-of-month dropdown, not free text) · Fixed expenses (category: Rent, EMI, Bills, Insurance, Family support, Other + amount) · Subscriptions · Debt (type, outstanding amount, minimum payment, due date, interest priority if known) · **Investments** (type: mutual fund SIP, stocks, PPF/EPF, fixed deposit, other, none yet + monthly amount) · Goals (name, target amount, current savings, deadline, priority) · Planned monthly savings.
- **Design:** stepper with progress indicator, one section per step (income → expenses → debt → **investments** → goal → savings), light form fields, reassurance copy under the fold: *"This helps UrPaisa estimate your safe to use money. You can edit it anytime."* Each step is introduced by the mascot (§2.4) asking that step's question, rather than a plain form label.

> Note: this adds an "Investments" data category not yet listed in [02-financial-situation-model-prd.md](PRDs/02-financial-situation-model-prd.md) §2–§5. It's user-declared amounts only (no account access), consistent with [09](PRDs/09-data-privacy-ai-safety-prd.md) §3's "Allowed" data list, but PRD 02 should be updated to formally include it before Milestone 2 builds the real schema.

### 4.4 Safe-to-Use Money Result Screen

- **Purpose:** the emotional aha moment — first real insight.
- **Hero card:** "₹X safe to use this month", subtext "After must-pay expenses, planned savings, and debt commitments."
- **Secondary stats:** Safe daily spend · Safe weekly spend · Do-not-touch amount · Confidence badge (High/Medium/Low).
- **Disclaimer:** "This is an estimate based on what you shared." (required whenever confidence is Medium/Low, per PRD 03 §7).
- **CTA:** "Show my first money action" → Home.
- **Design:** the ₹ number is the single largest element on screen; everything else is secondary and visually quieter.

### 4.5 Home / Daily Mentor Screen (most important screen)

- **Purpose:** the core daily loop.
- **Elements, top to bottom:**
  1. Greeting ("Good morning")
  2. Safe-to-use money card (₹12,400 safe to use)
  3. Daily safe spend line (₹620 safe per day until next payday)
  4. Money Zone Meter (see §5) — e.g. Green: "You are spending safely right now."
  5. Today's action card: action text, one-line reason, e.g. *"Move ₹500 to your emergency fund before weekend spending starts."* / *"This keeps your goal on track without affecting your bills."*
  6. Action buttons: Done / Skip / Remind me later
  7. Small "Ask UrPaisa" input (routes to Coach)
- **Design constraint:** exactly one action card is visible — no list of recommendations, no secondary nudges stacked below it.

### 4.6 Money Zone Meter (component)

Four states, each with color + short label + one-line explanation:

| State | Color | Label | Explanation |
|---|---|---|---|
| Green | `zone-green` | Safe | "You are spending safely." |
| Yellow | `zone-yellow` | Be careful | "Slow down to protect your goals." |
| Red | `zone-red` | Risky | "Spending more may hurt bills or savings." |
| Locked | `zone-locked` | Do not touch | "This money is protected for bills, debt, or savings." |

Reused on Home and the Safe-to-Use Result screen; logic sourced from PRD 03 §5.

### 4.7 Goals and Debt Screen

- **Goal card:** name, "₹18,000 saved of ₹60,000", "30% complete", progress bar, on-track note ("On track if you save ₹4,000 this month"). Buttons: Add money / Adjust goal / Ask coach.
- **Debt card:** debt type, outstanding amount, "Payment due in 3 days", urgency label (High/Medium/Low, per PRD 04 §5), recommended action ("Pay ₹2,000 extra this week if possible.").
- **Design:** simple cards + progress bars + urgency badges only — no table of all transactions, no amortization schedule (explicitly out of scope, PRD 04 §7).

### 4.8 AI Coach Chat Screen

- **Purpose:** grounded, practical Q&A on the user's own data (PRD 07).
- **Suggested prompt chips:** "Can I afford this?" · "What should I do today?" · "How much should I save this week?" · "Should I pay debt or save first?" · "Why am I not saving enough?" · "Help me reduce spending"
- **Example exchange:**
  - User: "Can I spend ₹3,000 today?"
  - UrPaisa: "You can spend ₹3,000, but it will move you close to the yellow zone. A safer amount today is ₹1,800. If you still spend ₹3,000, keep tomorrow's spending under ₹400."
  - Next best action: "Set a ₹1,800 limit for today."
- **Design:** every answer ends in exactly one next action; include "Based on the information you shared" disclaimer when confidence is not high.

### 4.9 Weekly Reflection Screen

- **Purpose:** short mentor-style review, no guilt.
- **Content:** "Your Week in Money" summary (e.g. "You completed 4 out of 6 money actions...") · sections: What went well / What got skipped / Pattern detected / One next best action / Goal progress.
- **CTA:** "Start next week's plan"
- **Design:** encouraging tone, small cards + simple progress indicators, no red/negative framing for skipped actions.

### 4.10 Empty, Error, and Low-Confidence States

| State | Copy |
|---|---|
| No goal added | "Add one goal so UrPaisa can guide your money better." |
| No debt added | "No debt added. If you have debt, adding it helps UrPaisa prioritize better." |
| Low confidence | "Your estimate may be less accurate because a few details are missing." |
| Negative safe-to-use money | "Your safe to use money is tight this month. Focus on essentials first. Your best action is to review one flexible expense today." |
| AI unavailable | "UrPaisa could not generate a personalized response right now. Here is a safe basic suggestion based on your inputs." |

These are required states per PRD 03 §6/§7 and PRD 09's failure-handling rules — not optional edge cases, must be designed alongside the primary states.

### 4.11 Habits Tab (lightweight, Phase 1)

Shows: completed actions, skipped actions, most-completed nudge type, one habit insight sentence. **Explicitly no formal Money Health Score in Phase 1.**

---

## 5. Reusable Component List

Design each once, reuse everywhere (avoid per-screen rebuilds):

- Safe-to-use money card
- Money zone meter (§4.6)
- Daily action card
- Done / Skip / Remind-me-later button group
- Goal card
- Debt card
- AI answer card (with next-action footer)
- Reflection card
- Confidence badge (High/Medium/Low)
- Urgency badge (High/Medium/Low)
- Protected ("do-not-touch") money breakdown card
- Empty state card
- Low-confidence alert
- Negative-money alert

---

## 6. Explicit Constraints (do not design these in Phase 1)

Matches [IMPLEMENTATION_PLAN.md — Explicitly Out of Scope](IMPLEMENTATION_PLAN.md#explicitly-out-of-scope-for-phase-1):

- Native app specific flows, bank linking screens, UPI integration screens
- Investment recommendation screens, credit product recommendation screens, tax advice screens
- Complex analytics dashboard, formal Money Health Score
- AI Financial Twin simulations, family finance mode, emergency mode as a full feature

---

## 7. Prototype Scope (Milestone 0.5 deliverable)

Fidelity progression:

1. **Low-fidelity wireframes** — layout and IA only, for: Onboarding, Home/Daily, Safe-to-Use Result, Daily Action, Coach Chat, Goals & Debt, Weekly Reflection.
2. **High-fidelity mobile screens** — same set, styled with the §2 design tokens, at ~375px viewport first.
3. **Clickable prototype**, covering the full journey in order:
   Welcome → Onboarding → Financial Setup → Safe-to-Use Result → Home/Daily Mentor → Goals & Debt → AI Coach → Weekly Reflection → Empty/low-confidence/negative-money states.

Definition of done (matches IMPLEMENTATION_PLAN.md Milestone 0.5): a clickable mobile-first prototype exists, covers this full journey, is clear at 375px, and every screen still reduces to one number / one action / one next step.

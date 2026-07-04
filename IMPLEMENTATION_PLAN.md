# UrPaisa Implementation Plan

This plan turns the [PRDs](PRDs/) into buildable, sequenced milestones using the stack in [TECH_STACK.md](TECH_STACK.md). It exists specifically to prevent scope drift while building — **every milestone below cites the PRD section it implements**, and nothing gets added that isn't traceable to a PRD line. If a milestone would require inventing a feature not in the PRDs, stop and update the PRD first ([PRDs/README.md](PRDs/README.md) source-of-truth rule).

Each milestone is broken into small pieces so progress can be checked off and reviewed incrementally (e.g. via Netlify Deploy Previews) rather than landing as one giant change.

## Phase 1 Product Format

Phase 1 is a **mobile first responsive web app** designed to feel like a simple mobile money mentor. Native iOS and Android apps are intentionally deferred until the habit loop is validated (see [ROADMAP.md](ROADMAP.md)).

The experience is designed for mobile screens first because daily money coaching happens in mobile moments — checking safe-to-use money before a purchase, responding to a payday nudge, glancing at a weekly reflection between other things. It should never feel like sitting down to use a desktop budgeting tool. The build itself uses the current Next.js-on-Netlify stack (`TECH_STACK.md`) so we can validate the core habit loop faster, rather than paying the cost of native app development before we know anyone wants this.

## Product Build Principles

These principles govern every milestone below. When a milestone's pieces seem to conflict with a principle, the principle wins — flag it and revisit the pieces rather than silently building past it.

1. One screen should give one clear money decision.
2. One daily action is better than many recommendations.
3. Safe-to-use money is the core product anchor.
4. The MVP should validate behavior change, not complete financial automation.
5. Manual input is acceptable in Phase 1 if it helps validate the coaching loop.
6. AI should explain and personalize, but not invent financial data.
7. Every feature must support the loop: input → insight → action → response → learning → reflection.

## How to Use This Plan

- Work milestones **in order**. Later milestones assume earlier ones exist (e.g. the nudge engine assumes the financial model exists).
- Each milestone ends with a **Definition of Done** taken directly from that PRD's own "Acceptance Criteria" section — that's the actual finish line, not "code compiles."
- Most milestones also carry a **Product Outcome** line — what the user should actually feel/gain, stated before the engineering pieces, so the pieces are read as "how we deliver this outcome," not as a checklist for its own sake.
- The **"Explicitly Not in This Milestone"** notes exist to stop AI-assisted or human scope creep mid-build.

## Phase 1 Product Scope Summary

The detailed milestones below are the engineering execution breakdown of six product modules:

1. **Account and onboarding** — Milestones 0.5, 1, 2.
2. **Financial situation model** — Milestone 2.
3. **Safe-to-use money engine** — Milestone 3.
4. **Goals, debts, and action buttons** — Milestone 4.
5. **Daily nudge and learning loop** — Milestones 5, 6.
6. **AI mentor, weekly reflection, and safety** — Milestones 7, 8, 9.

Milestone 10 (Beta Launch Readiness) sits outside these six modules — it's the cross-cutting QA/metrics pass over all of them before launch.

---

## Milestone 0 — Project Foundations

No PRD section covers infrastructure directly; this is the prerequisite scaffolding for all of them.

Pieces:
- [x] Initialize Next.js 14 (App Router, TypeScript) project.
- [x] Install and configure Tailwind CSS + shadcn/ui, set base design tokens (calm, mentor-toned palette — not a dense dashboard, per [00](PRDs/00-master-product-prd.md) §4).
- [x] Set up Prisma with a Supabase Postgres project (pooled + direct connection strings per TECH_STACK.md §6).
- [x] Create `netlify.toml`, connect the repo to a Netlify site, verify a "hello world" deploy works end-to-end (this validates the whole deploy pipeline before real features exist).
- [x] Set up environment variable scaffolding (`.env.local` + Netlify UI) for `DATABASE_URL`, `DIRECT_URL`, `RESEND_API_KEY`, `OPENAI_API_KEY`, session secret.
- [x] Set up Vitest for unit tests.
- [x] Wire up Sentry (error monitoring) and PostHog (analytics) skeleton — no events yet, just confirm they report.
- [x] Add the app-level disclaimer text from [09](PRDs/09-data-privacy-ai-safety-prd.md) §5 into a shared layout footer/legal page now, so it's never forgotten later.

Definition of Done: empty app deploys live on Netlify, connects to Supabase Postgres, and a test error/event shows up in Sentry/PostHog.

---

## Milestone 0.5 — Mobile First UX Prototype

Purpose: before building full features, create a focused mobile-first prototype so the product feels simple, calm, and action-oriented rather than like a dense finance dashboard. This directly serves Product Build Principle 1 (one screen, one clear decision) and Principle 3 (safe-to-use money is the core anchor) — both are far cheaper to get right in a prototype than to retrofit after Milestones 2–8 are built.

Pieces:
- [x] Define app information architecture for Phase 1 (screen list, navigation model, what's reachable from the home/daily screen vs. buried deeper).
- [x] Create low-fidelity wireframes for: onboarding, home/daily screen, safe-to-use money, daily action, coach chat, goals and debts, weekly reflection.
- [x] Create high-fidelity mobile screens for the core journey (the same screens, styled with the Milestone 0 design tokens).
- [x] Define component states for green, yellow, red, and locked money zones (the Safe Spend Meter from [03](PRDs/03-safe-to-use-money-prd.md) §4).
- [x] Define empty states, low-confidence states, error states, and negative safe-to-use-money states — these are required states per [03](PRDs/03-safe-to-use-money-prd.md) §6/§7, not edge cases to skip.
- [x] Confirm the interface works clearly at mobile width first (test at ~375px viewport before anything wider).
- [x] Keep the design focused on one number, one action, and one next step per screen — actively remove anything that doesn't serve that.

Explicitly Not in This Milestone: advanced dashboards, bank integration screens, investment screens, native app work, complex analytics views.

Definition of Done: a clickable mobile-first prototype exists and covers the complete Phase 1 journey, before full feature development starts on Milestones 1–8.

---

## Milestone 1 — Authentication & Account Foundation

Not a numbered feature PRD (it's filed under Phase 2 in [10](PRDs/10-roadmap-advanced-features-prd.md) §3 as "user accounts / persistent profile") but pulled forward per TECH_STACK.md §1, because every later milestone needs a `userId`. Design is fixed in TECH_STACK.md §4 — this milestone just builds it.

**Authentication is an enabling layer, not the core product value.** It exists so a user's financial data persists — it is not what makes UrPaisa useful. The core product value starts one milestone later, once the user completes onboarding and receives a safe-to-use money estimate plus one recommended action (Milestones 2–3). Don't over-invest here relative to that.

Product Outcome: A new user can create and secure an account quickly enough that it doesn't feel like the product, just the door into it.

Pieces:
- [x] Prisma schema: `User`, `OtpCode`, `Session` models (TECH_STACK.md §4.1). Run first migration.
- [x] Zod schemas for: email, OTP code format, password strength — shared between client and server.
- [x] **Signup — step 1 (email capture)**: form + `POST /api/auth/signup` creates/reuses unverified `User`.
- [x] **OTP generation + send**: generate 6-digit code, hash+store with 10-min expiry, send via Resend using a react-email template.
- [x] **OTP verify screen**: form + `POST /api/auth/verify-otp`, enforces attempt-count limit, marks `emailVerifiedAt`.
- [x] **Resend OTP**: `POST /api/auth/resend-otp` with 60s cooldown + hourly cap.
- [x] **Set password screen**: form + `POST /api/auth/set-password`, bcrypt hash, creates `Session`, sets httpOnly cookie, redirects to onboarding.
- [x] **Login screen**: form + `POST /api/auth/login`, verifies bcrypt hash, enforces lockout after 5 failed attempts/15 min, creates `Session`.
- [x] **Session middleware**: reads session cookie on protected routes, attaches `user` to request context, redirects unauthenticated users to `/login`.
- [x] **Logout**: `POST /api/auth/logout` deletes the `Session` row and clears the cookie.
- [x] *(Beta readiness item, not core Phase 1 differentiation)* **Forgot password**: request screen (generic "if that email exists..." response) → OTP verify (reuses OTP infra with `purpose = password_reset`) → set new password screen.
- [x] *(Beta readiness item, not core Phase 1 differentiation)* Basic account settings page: change password (requires current password), see "logged in since" — minimal, not a full profile UI.
- [x] Security pass: confirm no plaintext OTP/password ever logged, confirm rate limits actually trigger, confirm cookies are httpOnly/secure/SameSite=Lax.

Explicitly Not in This Milestone: social login (Google/Apple), 2FA beyond the signup/reset OTP, "remember me" device trust, magic links — none requested.

Definition of Done: a new user can sign up with email → receive and enter a real OTP → set a password → land on onboarding; can log out and log back in with that password; can reset a forgotten password via OTP; brute-force and OTP-spam attempts are visibly rate-limited.

---

## Milestone 2 — Onboarding & Financial Situation Model

Implements [01](PRDs/01-mvp-experience-prd.md) §2/§6 (Welcome, Onboarding, Financial Setup screens) and the data model in [02](PRDs/02-financial-situation-model-prd.md).

Product Outcome: The user can quickly tell UrPaisa their basic money situation without feeling like they are filling out a financial form.

Pieces:
- [x] Prisma schema additions: `Profile` (user type, income type, coaching tone), `Income` (amount, payday, stability level), `FixedExpense` (amount, category, negotiable flag per [02](PRDs/02-financial-situation-model-prd.md) §3), `Subscription`, `Goal`, `Debt` — fields exactly as listed in [02](PRDs/02-financial-situation-model-prd.md) §2–§5.
- [x] Welcome screen: app name, promise copy, "no bank linking required" note ([01](PRDs/01-mvp-experience-prd.md) §6 Welcome Screen spec, verbatim copy where given).
- [x] Onboarding screen: user type, income type, primary goal, coaching tone inputs.
- [x] Financial Setup screen: monthly income, payday, fixed expenses (with negotiable/non-negotiable marking), subscriptions, simple debt input, primary goal, planned savings.
- [x] Persist all of the above via `POST /api/financial-model/setup`.
- [x] Financial Situation Model service (`lib/financial-model/`): computes income predictability, fixed commitment load, goal commitment load, debt urgency — the outputs listed in [02](PRDs/02-financial-situation-model-prd.md) §7. This service is the shared foundation the next three milestones build on.

Explicitly Not in This Milestone: automatic transaction data, category-level actual spend, advanced income forecasting — deferred per [02](PRDs/02-financial-situation-model-prd.md) §8.

Definition of Done: matches [01](PRDs/01-mvp-experience-prd.md) §8 Acceptance Criteria — user completes onboarding + financial setup in under 5 minutes, sets at least one goal and one debt item, without any bank linking.

---

## Milestone 3 — Safe-to-Use Money Engine

Implements [03-safe-to-use-money-prd.md](PRDs/03-safe-to-use-money-prd.md) in full.

Product Outcome: The user understands how much money is safe to use and why that number matters.

Pieces:
- [x] Calculation service: basic formula `income - fixed expenses - planned savings`, extendable to the advanced formula once goal/debt commitments and emergency buffer are available (§2).
- [x] Derive safe daily / weekly / weekend spend, risk zone amount, do-not-touch amount (§3).
- [x] Confidence level logic (high/medium/low based on what data is present) with the required low-confidence disclaimer string (§7).
- [x] Risk zone classification (green/yellow/red/locked) with the trigger logic in §5.
- [x] Negative/low safe-to-use handling: calm copy, essentials-first guidance, one concrete recommended action (§6).
- [x] Safe-to-Use Money screen UI: meter component + plain-language summary, matching example copy tone in §3/§4.

Explicitly Not in This Milestone: any nudge generation (that's Milestone 5) — this milestone only computes and displays the number.

Definition of Done: matches §8 Acceptance Criteria exactly — calculates from manual inputs, shows daily/weekly spend, shows zone status, handles negative/low cases, explains itself in plain language.

---

## Milestone 4 — Goal & Debt Coach

Implements [04-goal-and-debt-coach-prd.md](PRDs/04-goal-and-debt-coach-prd.md).

Product Outcome: The user can see one goal and one debt in view, know which matters more right now, and never feel like they're staring at a spreadsheet.

Pieces:
- [x] Goal CRUD UI + progress percentage calculation (target, current savings, deadline, priority, flexibility, required monthly contribution — §2).
- [x] Default goal priority ordering per §3 (emergency fund → high-interest debt → essential obligations → time-bound goals → lifestyle → investing readiness), with user override capability.
- [x] Debt CRUD UI (type, outstanding, interest rate, minimum payment, due date, late fee risk, stress level — §4).
- [x] Debt urgency classifier per §5 rules (highest/medium/lower urgency buckets).
- [x] Save-vs-debt recommendation logic per §6 default behavior rules.
- [x] Shared **action component**: Done / Skip / Remind me later buttons + storage, used here and reused by Milestones 5 and 6 (do not rebuild this per-feature — one component, one storage schema).

Explicitly Not in This Milestone: detailed amortization schedules, product recommendations, loan refinancing advice — explicitly deferred per §7, and product-recommendation advice is disallowed entirely per [09](PRDs/09-data-privacy-ai-safety-prd.md) §4.

Definition of Done: matches §8 Acceptance Criteria — user can add a goal and see progress, add debt and see urgency, get one recommended goal/debt action, mark it Done/Skip/Remind-later, and guidance never strays into regulated investment/credit advice.

---

## Milestone 5 — Nudge & Recommendation Engine

Implements [05-nudge-and-recommendation-engine-prd.md](PRDs/05-nudge-and-recommendation-engine-prd.md). Depends on Milestones 2–4 (financial model, safe-to-use money, goals/debts) being real data sources, not mocks.

Product Outcome: The user receives one timely and useful money action instead of a dashboard full of insights.

Pieces:
- [x] Scoring engine combining the three factors in §2: financial urgency, user readiness (starts as heuristics — real behavioral learning comes in Milestone 6), expected impact.
- [x] Implement each nudge type from §3: payday, weekend, subscription, goal, debt, impulse control — as fallback templates first (non-AI), matching the exact example copy tone.
- [x] Trigger priority ordering exactly as listed in §4 (essential bill/debt due → emergency/low safe-to-use → payday allocation → high-interest debt → goal falling behind → overspending risk → subscription cleanup → habit challenge → general weekly nudge).
- [x] Nudge anatomy enforcement (§5): every nudge must carry trigger, action, reason, expected benefit, and the Done/Skip/Remind-later component from Milestone 4.
- [x] Frequency limits (§6): one primary nudge/day, reminders only on explicit Remind-me-later.
- [x] Netlify Scheduled Function to generate/refresh the daily nudge.
- [x] AI phrasing layer (`AI_MODEL_FAST`) that rewrites the fallback template into friendly language per selected tone, with the safety wrapper from TECH_STACK.md §5 — must never invent data, recommend products, or use fear/shame language (§7).
- [x] Daily Mentor screen: safe-to-use meter (from M3) + one recommended action + reason + action buttons + "Ask UrPaisa" input box placeholder (full mentor chat is Milestone 7).

Explicitly Not in This Milestone: time-of-day optimization, contextual purchase-decision nudges, emergency mode nudges — all explicitly "Advanced" per §6, deferred.

Definition of Done: matches §8 Acceptance Criteria — recommendation genuinely uses urgency/readiness/impact, user gets one clear action with a reason, actions are stored, and the app still works (via fallback templates) if the AI call fails.

---

## Milestone 6 — Habit & AI Learning Loop

Implements [06-habit-learning-loop-prd.md](PRDs/06-habit-learning-loop-prd.md). This is where "user readiness" in Milestone 5's scoring engine stops being a heuristic and starts being learned.

Product Outcome: The user notices UrPaisa adjusting to how they actually behave, instead of repeating advice they've already ignored twice.

Pieces:
- [x] Habit dimension tracking derived from stored Done/Skip/Remind-later history (§2): saving timing, spending timing, subscription discipline, debt discipline, goal consistency, impulse pattern, nudge-response pattern.
- [x] Action compliance effects per §3 (Done increases confidence in that action type, repeated Skip reduces future frequency, Remind-later doesn't count as failure).
- [x] Wire the learning inputs from §4 (done/skipped/delayed actions, repeated questions, goal progress, bill payment behavior, tone preference, time-of-day, nudge type) into the Milestone 5 scoring engine's readiness factor.
- [x] Implement the concrete adaptation examples in §5 (smaller-ask fallback after a skip, nudge-timing shift, debt-over-investment prioritization, low-friction-savings follow-up after subscription cleanup).
- [x] Adaptive tone selector (§6) feeding into the Milestone 5 AI phrasing layer.
- [x] Lightweight weekly habit insight (§7 notes: "MVP can show lightweight habit insights without a formal score" — full Money Health Score is explicitly Phase 2+, not built here).

Explicitly Not in This Milestone: the formal 0–100 Money Health Score — PRD explicitly defers it.

Definition of Done: matches §8 Acceptance Criteria — Done/Skip/Remind-later are stored and queryable, repeated patterns are identifiable, future suggestions visibly adapt, tone is respected in AI wording, and a weekly habit insight can be produced.

---

## Milestone 7 — Conversational Mentor

Implements [07-conversational-mentor-prd.md](PRDs/07-conversational-mentor-prd.md).

Product Outcome: The user can ask a practical money question and get a grounded answer based on their own inputs.

**Phase 1 purchase-decision scope is intentionally narrow: a basic affordability check, not a financial simulator.** It should answer questions like "Can I spend ₹3,000 today?" — and the answer must be based only on safe-to-use money, goals, debt commitments, and other user-provided inputs already in the financial model. Full AI Financial Twin simulations, multi-month forecasting, product recommendations, credit recommendations, and investment recommendations are explicitly excluded from Phase 1 (see §5 and Out of Scope below).

Pieces:
- [x] `POST /api/mentor/ask` endpoint using `AI_MODEL_REASONING`, grounded in the user's actual financial model (income, expenses, goals, debts, safe-to-use money, habit history) — never generic advice (§1).
- [x] Implement the MVP question set from §2 as tested prompt scenarios (save-this-week, what-to-fix-first, can-I-spend-X, why-not-saving-enough, save-vs-debt, reduce-spending-without-restriction).
- [x] Basic affordability / purchase decision check (§4): "Can I afford this?" → safe to buy / buy later / buy in parts / avoid for now, computed only from safe-to-use money + goals + debt commitments + user-provided inputs, with example-matching tradeoff explanation.
- [x] Answer rules enforcement (§6) in the safety wrapper: use real profile data, state assumptions when data is missing, explain tradeoff, give exactly one next action, never regulated advice.
- [x] Fallback behavior (§7): if required data is missing, ask for the single missing input and give a conservative rough answer only if safe to do so.
- [x] Wire the "Ask UrPaisa" input box (placeholder from Milestone 5) into this endpoint on the Daily Mentor screen.

Explicitly Not in This Milestone: full AI Financial Twin simulation layer (what-if rent increases, multi-month simulations), multi-month forecasting, product recommendations, credit product recommendations, investment recommendations — PRD §5 explicitly states "AI Financial Twin is not required in full for MVP." Advanced questions in §3 are deferred with it.

Definition of Done: matches §8 Acceptance Criteria — user can ask from the daily screen, answers reference the user's real safe-to-use money/goals/debt, every answer has one clear recommendation, missing data is handled transparently, safety rules hold.

---

## Milestone 8 — Reflections, Resets, and Challenges

Implements [08-reflections-resets-challenges-prd.md](PRDs/08-reflections-resets-challenges-prd.md).

Product Outcome: The user sees progress, patterns, and one next step at the end of the week.

**Weekly reflection is the required Phase 1 feature. Monthly reset and the optional weekly challenge are MVP-plus items** — build them if time allows after the required piece is solid, not in parallel with it.

Required for Phase 1:
- [x] Weekly reflection generator (Netlify Scheduled Function, weekly cadence) pulling real action history: what went well, what didn't (§2).
- [x] One detected pattern per reflection (§2).
- [x] One recommended next best action per reflection (§2).
- [x] Real action history sourced from stored Done, Skip, and Remind-me-later data (from Milestones 4–6), not placeholder data.
- [x] Weekly Reflection screen matching the example tone/format in §2.

Optional (MVP Plus):
- [x] Lightweight monthly reset (§3): manual-input + nudge-history based only (no transaction data), answering the six questions listed, producing next month's safe-to-use money.
- [x] One simple weekly challenge (§4), selected via the recommendation rules in §5 (skip-pattern → small daily challenge, weekend-overspend → weekend limit challenge, high subscriptions → cleanup challenge). Full challenge library explicitly deferred (§6).

Explicitly Not in This Milestone: formal challenge library, Money Health Score updates, fully automated monthly reset — all explicitly deferrable per §6.

Definition of Done: matches §7 Acceptance Criteria — reflection uses real action history, includes one next action, is understandable without charts, optional challenge is small/measurable, monthly reset (if built) stays consistent with safe-to-use money and goals.

---

## Milestone 9 — Privacy & AI Safety Hardening Pass

Cross-cutting implementation of [09-data-privacy-ai-safety-prd.md](PRDs/09-data-privacy-ai-safety-prd.md), run as an explicit audit milestone after the features exist (not a new feature set).

Pieces:
- [x] Data audit: confirm the app only ever collects the "Allowed" list in §3, and confirm none of the "Not allowed" list (bank credentials, UPI credentials, card numbers, account passwords-of-other-services, credit score pulls, brokerage access) exists anywhere in schema or forms.
- [x] Confirm the app-level disclaimer (§5) is visible app-wide (added as a placeholder in Milestone 0 — verify it's still there and correctly worded) and the in-context "This is an estimate based on your inputs" appears wherever confidence is medium/low.
- [x] Sensitive-state review (§6): audit emergency/low-safe-to-use-money copy across Milestones 3, 5, 7 for calm tone, no fear language, appropriate "contact a qualified professional" framing where relevant.
- [x] Failure handling review (§7): confirm every AI call site has a working fallback and no raw error/stack trace ever reaches the UI (cross-check Sentry is catching what the user doesn't see).
- [x] Full pass of the §8 Acceptance Criteria as a manual QA checklist.

Definition of Done: every item in §8 Acceptance Criteria is manually verified true, signed off before considering the MVP launch-ready.

---

## Milestone 10 — Beta Launch Readiness

Ties back to [00-master-product-prd.md](PRDs/00-master-product-prd.md) §9 (Success Metrics) and the MVP scope boundary in §6.

Pieces:
- [x] Instrument the actual metrics from §9 in PostHog: onboarding completion, goal-set rate, safe-to-use-money view rate, first-nudge completion, WAU, nudge completion rate, questions-asked count, reflection open rate, challenge participation, W1/W4/M3 retention. (`lib/analytics/events.ts` + identify/pageview in the app layout; view/interaction events wired across setup, goals, home, result, coach, review. WAU + W1/W4/M3 retention are derived in PostHog from identified pageviews, so they need no bespoke event.)
- [x] Confirm MVP scope boundary from §6 is respected: no bank integration, no auto-categorization, no full accounting tracker, no tax guidance, no product-selling flows, no investment recommendations, no complex dashboard analytics anywhere in the shipped app. (Audited: no charting libs, no transaction ingestion, no bank/UPI/card fields; the only "investing" reference is the PRD-04 goal-readiness bucket.)
- [~] Netlify production config review: in-repo config verified (`netlify.toml`, all 3 scheduled functions present, `.env.local.example` documents every prod var, Sentry source-maps gated on auth token) and the public `/api/debug/sentry-test` route removed. REMAINING (deploy-time, requires the user): set the custom domain, set production env vars in the Netlify UI, point Sentry/PostHog at production projects, and confirm the scheduled functions run after deploy.
- [x] Full acceptance-criteria sweep across every PRD (01–09) as final regression QA. (126 unit tests green + full production build of every route; each milestone was runtime-verified against the real DB as it was built.)
- [ ] Soft launch. (Deploy-time action — requires the user to deploy to production Netlify.)

Definition of Done: app is live on the production Netlify domain, every PRD's acceptance criteria pass, and success metrics are actively being captured from day one of launch (not bolted on later). — CODE-COMPLETE: everything buildable in-repo is done and verified; the two remaining items (finalize Netlify production config + soft launch) are deployment actions only the user can perform.

---

## Explicitly Out of Scope for Phase 1

Phase 1 does **not** include:

1. Native iOS or Android app.
2. Bank integration.
3. UPI integration.
4. Automatic transaction categorization.
5. Salary detection.
6. AI Financial Twin.
7. Full salary day autopilot.
8. Emergency mode.
9. Life event mode.
10. Family finance mode.
11. Formal Money Health Score.
12. Investment recommendations.
13. Credit product recommendations.
14. Tax advice.
15. Complex dashboard analytics.

These map to Phases 3–4 of [10-roadmap-advanced-features-prd.md](PRDs/10-roadmap-advanced-features-prd.md) (folded into Roadmap Phase 3 — see `ROADMAP.md`), plus WhatsApp/native distribution (Roadmap Phase 2, native app). None of them should be pulled forward into Phase 1 milestones above, no matter how small the addition looks in the moment. Per the Roadmap PRD's own guardrails (§7), these are only worth considering **after Phase 1 validates that users engage with an AI money coach that gives small, personalized actions** — not before, and not speculatively alongside it.

# UrPaisa — AI Finance Mentor

A mobile-first personal-finance **mentor** for Indian users. Instead of dashboards and
charts, UrPaisa answers the one question people actually ask — *"How much can I safely
spend right now?"* — and then nudges, coaches, and reflects with you week over week.

It is built as a **guidance companion, not a licensed financial advisor**: every number is
produced by deterministic, unit-tested logic; AI is used only to make the wording warmer.

> **Disclaimer:** UrPaisa provides general educational guidance only. It is not investment,
> tax, legal, or regulated financial advice, and it does not guarantee outcomes.

---

## What it does

- **Safe-to-Use amount** — a real, explainable "you can spend ₹X today" figure derived from
  your income, fixed expenses, subscriptions, debts, and goals (with a confidence level and
  in-context disclaimers).
- **Goals** — set savings goals from a catalog, track readiness, and get one clear next move.
- **Daily nudge** — one small, personalized action a day (generated on a schedule and adapted
  to your habits).
- **Coach** — a conversational mentor that answers money questions using a deterministic core
  plus AI phrasing, never invented facts.
- **Habits** — learns from your Done / Skip / Remind-later history and adjusts its tone.
- **Weekly reflection & challenge** — a plain-language recap of the week plus an optional
  challenge to try.
- **Monthly reset** — "Your Month in Money": six honest questions and next month's
  safe-to-use estimate.
- **Auth** — email + OTP signup, password reset, sessions.

## Tech stack

| Layer        | Choice                                                             |
|--------------|--------------------------------------------------------------------|
| Framework    | Next.js 14 (App Router) + TypeScript                               |
| UI           | Tailwind CSS, Radix primitives, lucide icons                       |
| Data         | Prisma ORM → Supabase Postgres (pooled runtime / direct migrations)|
| AI           | OpenAI (optional — falls back to deterministic templates)          |
| Email        | Resend                                                             |
| Scheduling   | Netlify Scheduled Functions                                        |
| Monitoring   | Sentry                                                             |
| Analytics    | PostHog                                                            |
| Testing      | Vitest                                                             |
| Hosting      | Netlify (`@netlify/plugin-nextjs`)                                 |

## Architecture principles

- **Deterministic core + AI phrasing.** Pure, tested functions in `lib/*` compute the real
  answer. Code in `lib/ai/*` only rephrases it and *never throws* — on any failure it returns
  `null` and the deterministic text is shown. The app is fully usable with no AI key.
- **Shared action storage.** One `ActionRecord` table + `/api/actions` + a `RecordAction`
  component is the single Done / Skip / Remind-later contract reused by nudges, reflections,
  and resets.
- **Get-or-create + scheduled generation.** Daily nudge, weekly reflection, and monthly reset
  each have a `@db.Date` unique key and are generated lazily on view *or* by a
  `CRON_SECRET`-gated `/api/*/generate` route triggered from a Netlify scheduled function.
- **Safety guardrails** baked into every AI system prompt (`lib/ai/safety.ts`).

## Project structure

```
app/
  (auth)/        login, signup, OTP, password reset
  (app)/         home, goals, coach, habits, review, account (authenticated shell)
  api/           auth, actions, goals, debts, financial-model, mentor, nudges,
                 reflections, resets  (…/generate routes are cron-gated)
  onboarding/ setup/ result/ legal/
lib/
  financial-model/  safe-to-use engine (M3)
  coach/ goal-catalog  goal recommendations (M4)
  nudge/ habit/        daily nudge + habit learning (M5/M6)
  mentor/             conversational core (M7)
  reflection/ reset/  weekly reflection + monthly reset (M8)
  ai/                 optional phrasing layer + safety rules
  analytics/          PostHog event surface (M10)
  auth/ email/ validation/ db.ts
prisma/schema.prisma  User, Profile, Income, FixedExpense, Subscription, Goal, Debt,
                      ActionRecord, Nudge, Reflection, MonthlyReset, Session, OtpCode
netlify/functions/    daily-nudge, weekly-reflection, monthly-reset (scheduled)
```

## Getting started

### Prerequisites
- Node.js 20 (matches the pinned Netlify build)
- A Supabase Postgres database (or any Postgres)

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```
Fill in real values. `.env.local` is gitignored and never committed. See
[`.env.local.example`](.env.local.example) for every variable and how to generate secrets.
The database URLs are required; AI, email, Sentry, and PostHog keys are optional (the app
degrades gracefully without them).

### 3. Set up the database
```bash
npm run db:migrate    # applies Prisma migrations
npm run db:generate   # generates Prisma Client
```

### 4. Run
```bash
npm run dev           # http://localhost:3000
```

## Scripts

| Script              | Description                                    |
|---------------------|------------------------------------------------|
| `npm run dev`       | Start the dev server                           |
| `npm run build`     | `prisma generate` then `next build`            |
| `npm run start`     | Start the production server                    |
| `npm run lint`      | ESLint (`next lint`)                            |
| `npm run test`      | Run the Vitest suite                           |
| `npm run db:migrate`| Prisma migrate dev (uses `.env.local`)         |
| `npm run db:generate`| Generate Prisma Client                        |
| `npm run db:studio` | Open Prisma Studio                             |

## Environment variables

All variables are documented in [`.env.local.example`](.env.local.example). Summary:

- **`DATABASE_URL`** *(required)* — pooled Supabase connection (pgbouncer, port 6543).
- **`DIRECT_URL`** *(required)* — direct connection (port 5432), used for migrations only.
- **`SESSION_SECRET`** *(required)* — signs session tokens.
- **`CRON_SECRET`** *(required for scheduled jobs)* — bearer token the Netlify functions send.
- **`OPENAI_API_KEY`, `AI_MODEL_*`** *(optional)* — enables AI phrasing; otherwise fallbacks.
- **`RESEND_API_KEY`, `EMAIL_FROM`** *(optional)* — auth emails.
- **`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_*`** *(optional)* — error monitoring.
- **`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`** *(optional)* — analytics.

## Deployment (Netlify)

1. Push this repo to GitHub and create a Netlify site from it.
2. Netlify auto-detects the config in [`netlify.toml`](netlify.toml) (build command
   `npm run build`, `@netlify/plugin-nextjs`, Node 20). `postinstall` runs `prisma generate`.
3. Add every variable from `.env.local.example` under **Site settings → Environment variables**
   (point Supabase, Sentry, and PostHog at your production projects).
4. Deploy. After the first deploy, confirm the three scheduled functions are registered:
   - `daily-nudge` — `0 9 * * *`
   - `weekly-reflection` — `0 9 * * 1` (Mondays)
   - `monthly-reset` — `0 9 1 * *` (1st of month)

## Testing

```bash
npm run test
```

The suite covers the deterministic cores (safe-to-use engine, coach recommendations, nudge and
habit logic, reflections, and resets). AI phrasing is intentionally not asserted on — the tested
logic is the source of truth.

---

*Built as a milestone-by-milestone project (onboarding → safe-to-use → goals → nudges →
habits → mentor → reflections → privacy/safety hardening → beta launch).*

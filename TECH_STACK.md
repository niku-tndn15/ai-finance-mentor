# UrPaisa Tech Stack (Finalized)

This document is the finalized technical stack decision for UrPaisa. It is downstream of the [PRDs](PRDs/) — every choice here exists to serve the product described there, not the other way around. If a tech choice ever conflicts with a PRD requirement, the PRD wins and this doc gets updated.

Status: **Finalized for MVP (PRD Phase 1) build.**

## 1. Guiding Constraints

- Must deploy live on **Netlify**.
- MVP has **no bank linking** ([09-data-privacy-ai-safety-prd.md](PRDs/09-data-privacy-ai-safety-prd.md)) — all financial data is user-entered.
- Needs a **proper account system** (email verification + OTP + password) even though the Roadmap PRD ([10-roadmap-advanced-features-prd.md](PRDs/10-roadmap-advanced-features-prd.md)) files "user accounts / persistent profile" under Phase 2. We are pulling this forward into the foundation because almost every MVP feature (financial model, goals, debts, nudge history, habit learning) needs a durable `user_id` to hang data off of. This is a deliberate, scoped exception to the PRD's phase order, not scope creep.
- AI is a reasoning/coaching layer, not the product itself — it must degrade gracefully (fallback templates) per [05](PRDs/05-nudge-and-recommendation-engine-prd.md) §6/§8 and [09](PRDs/09-data-privacy-ai-safety-prd.md) §7.

## 2. Stack Summary

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **Next.js 14+ (App Router, TypeScript)** | One codebase serves pages, API routes, and server components. Netlify has an official first-class Next.js runtime, so we get SSR/serverless functions without maintaining a separate backend deploy. |
| Hosting | **Netlify** (`@netlify/plugin-nextjs`) | Explicit requirement. Next.js API routes compile to Netlify Functions automatically. |
| UI styling | **Tailwind CSS + shadcn/ui** | Fast to build a calm, mentor-like UI (not a dashboard-heavy one, per [00](PRDs/00-master-product-prd.md) §4). Accessible primitives out of the box. |
| Client server-state | **TanStack Query** | Caching/refetching for safe-to-use money, nudges, goals, etc. |
| Client UI state | **Zustand** | Small, for things like active tone, wizard step state — not a data layer. |
| Forms & validation | **React Hook Form + Zod** | Shared Zod schemas between client forms and server route handlers (single source of truth for validation, e.g. password strength, OTP format). |
| Backend | **Next.js Route Handlers** (`app/api/**`) running as Netlify Functions | No separate backend service to deploy/monitor. |
| Database | **Supabase Postgres** (Postgres only — **not** Supabase Auth) | Managed Postgres with a generous free tier and built-in connection pooling (pgbouncer), which matters for serverless functions. We deliberately don't use Supabase's built-in auth because it doesn't natively express "verify email via OTP → then set password → then log in with password"; we build that ourselves for full control per the user's explicit auth requirement. |
| ORM | **Prisma** | Type-safe schema/migrations matching the financial model entities in [02](PRDs/02-financial-situation-model-prd.md). |
| Auth | **Custom** (bcrypt password hashing, DB-backed sessions, OTP codes) | See §4. |
| Email | **Resend** (+ react-email for templates) | Sends verification OTP, welcome, and password-reset emails. |
| AI provider | **OpenAI API** | Two-tier model use: a fast/cheap model for high-volume nudge phrasing and tone adaptation ([06](PRDs/06-habit-learning-loop-prd.md)), a stronger reasoning model for the conversational mentor and weekly reflections ([07](PRDs/07-conversational-mentor-prd.md), [08](PRDs/08-reflections-resets-challenges-prd.md)). Model names are configured via env var, not hardcoded, so they can be upgraded without a redeploy of logic. |
| Background/scheduled jobs | **Netlify Scheduled Functions** | Daily nudge generation, weekly reflection generation, monthly reset — see [01](PRDs/01-mvp-experience-prd.md) §3/§4/§5. |
| Testing | **Vitest** (unit) + **Playwright** (e2e, added once core flows exist) | |
| Error monitoring | **Sentry** (free tier) | Needed to satisfy [09](PRDs/09-data-privacy-ai-safety-prd.md) §7 "do not expose raw technical errors" — we need to see them somewhere. |
| Analytics | **PostHog** (or Netlify Analytics as a cheaper fallback) | To measure the activation/engagement/behavior/retention metrics in [00](PRDs/00-master-product-prd.md) §9. |

## 3. Repository Structure (proposed)

```
/app
  /(auth)/signup
  /(auth)/verify-otp
  /(auth)/set-password
  /(auth)/login
  /(auth)/forgot-password
  /(app)/onboarding
  /(app)/dashboard          # Daily Mentor screen
  /(app)/safe-to-use        # Safe-to-Use Money screen
  /(app)/goals
  /(app)/debts
  /(app)/reflection         # Weekly reflection / monthly reset
  /api/auth/...
  /api/financial-model/...
  /api/nudges/...
  /api/mentor/...           # conversational endpoint
/components
  /ui                       # shadcn primitives
  /auth
  /mentor
  /goals-debts
/lib
  db.ts                     # Prisma client singleton
  auth/                     # session, otp, password helpers
  email/                    # Resend client + templates
  ai/                       # OpenAI client, prompt builders, safety guardrail wrapper
  financial-model/          # safe-to-use money, risk zone, goal/debt priority logic
/prisma
  schema.prisma
/emails                     # react-email templates
```

## 4. Auth Architecture (email verification → OTP → set password → password login)

Full step-by-step build sequence lives in `IMPLEMENTATION_PLAN.md` Milestone 1. This section fixes the *design*.

### 4.1 Data model (Prisma, conceptual)

- `User`: id, email (unique), passwordHash (nullable until set), emailVerifiedAt (nullable), name/nickname, createdAt.
- `OtpCode`: id, userId or pendingEmail, codeHash, purpose (`signup_verification` | `password_reset`), expiresAt, attemptCount, consumedAt.
- `Session`: id, userId, tokenHash, createdAt, expiresAt, lastSeenAt, userAgent/ip (for the user's own "active sessions" visibility later).

### 4.2 Signup flow

1. User submits email (+ name). We create (or reuse) a `User` row with `emailVerifiedAt = null`.
2. Server generates a 6-digit numeric OTP, stores only its **hash** in `OtpCode` with a 10-minute expiry, and emails the plain code via Resend.
3. User enters the OTP. Server checks: not expired, attempt count ≤ 5, hash matches. On success, marks `emailVerifiedAt`, consumes the code.
4. User is routed to "Set Password". Zod enforces min 8 chars + upper/lower/number (mirrored client + server side).
5. Server hashes the password with **bcryptjs** (pure-JS, safe for Netlify Functions bundling — no native binary issues) and saves it.
6. Server creates a `Session`, sets an **httpOnly, secure, SameSite=Lax** cookie containing a random session token (not a JWT — see 4.4 for why), redirects to onboarding.

### 4.3 Login flow

1. Email + password submitted.
2. Server confirms the email is verified, compares bcrypt hash.
3. Failed attempts are rate-limited per email+IP (see 4.5). Success creates a new `Session` and sets the cookie.

### 4.4 Why DB-backed sessions instead of a stateless JWT

We want to be able to revoke a session instantly (logout, password change, suspected compromise). A stateless JWT can't be revoked without an extra denylist mechanism anyway, so a simple `Session` table gives us the same serverless-friendly performance (one indexed lookup) with real revocation and an audit trail, at no extra complexity.

### 4.5 Security hardening (MVP-appropriate, upgrade path noted)

- OTP and passwords are **never stored or logged in plaintext**.
- Resend cooldown: 60s between OTP sends, max 5 sends/hour per email.
- Verify cooldown: max 5 wrong attempts per OTP, then it's invalidated and a new one must be requested.
- Login lockout: after 5 failed password attempts in 15 minutes, temporarily lock and require a fresh OTP re-verification to unlock.
- Generic responses on forgot-password ("if that email exists, we've sent a code") to avoid email enumeration.
- MVP rate limiting is DB-counter based (simple, no extra infra). If abuse becomes a real problem post-launch, upgrade path is **Upstash Redis** (serverless-native, works well with Netlify Functions) — noted here so it's a deliberate later decision, not forgotten.
- Forgot-password reuses the OTP mechanism (`purpose = password_reset`) rather than a separate email-link flow, per the user's explicit ask for an OTP-based flow throughout.

## 5. AI Integration Approach

- All AI calls go through one `lib/ai/` wrapper that enforces the safety rules in [09](PRDs/09-data-privacy-ai-safety-prd.md) §4 (no specific product recommendations, no promised returns, no shaming, no invented data) as part of the system prompt — not left to each call site to remember.
- Every AI-generated user-facing message must have a **non-AI fallback template** it can fall back to if the API call fails, per [05](PRDs/05-nudge-and-recommendation-engine-prd.md) §8 and [09](PRDs/09-data-privacy-ai-safety-prd.md) §7.
- Model tiering (configured via env, not hardcoded):
  - `AI_MODEL_FAST` — nudge phrasing, tone rewriting (high volume, low latency, cheap).
  - `AI_MODEL_REASONING` — conversational mentor answers, weekly reflections, purchase-decision assistant (needs to reason over the user's financial model).

## 6. Netlify / Supabase Deployment Notes

- `netlify.toml` configures the `@netlify/plugin-nextjs` build plugin.
- Supabase connection strings: **pooled** (`DATABASE_URL`, port 6543, pgbouncer) for the running app/serverless functions, **direct** (`DIRECT_URL`, port 5432) for Prisma migrations — this is the standard Prisma+Supabase+serverless pattern and avoids connection-exhaustion under Netlify's function concurrency model.
- Secrets (`DATABASE_URL`, `DIRECT_URL`, `RESEND_API_KEY`, `OPENAI_API_KEY`, session signing secret) live in Netlify's environment variable UI per deploy context (production vs. preview), never committed.
- Netlify Deploy Previews give us a free per-PR staging environment — useful for reviewing each milestone before merging.

## 7. Explicitly Rejected / Deferred

- **Supabase Auth / Auth0 / Clerk** — rejected because none natively expresses the exact "OTP verify → then set password → password login" sequence the user asked for without significant workaround; custom auth gives full control for little extra work at this scale.
- **Separate Express/Fastify backend on Render/Railway** — rejected, adds a second deployment target when Netlify Functions via Next.js already covers it.
- **Bank/transaction integrations, Plaid-like services** — explicitly out of MVP per [09](PRDs/09-data-privacy-ai-safety-prd.md) §3 and [10](PRDs/10-roadmap-advanced-features-prd.md) Phase 3.
- **Redis (Upstash) for rate limiting** — deferred to post-launch hardening (see §4.5), not needed at MVP traffic levels.

# UrPaisa Roadmap

This is the top-level product phasing for UrPaisa. It is the north star for sequencing work — `TECH_STACK.md` and `IMPLEMENTATION_PLAN.md` should be read as "how we execute Phase 1 of this roadmap," not as a competing plan.

## Product Phasing

UrPaisa will be built in phases to avoid overbuilding before validating the core habit loop.

### Phase 1: Mobile First MVP

The first version will focus on proving whether users find value in an AI money mentor that gives simple, personalized financial actions.

The MVP will include onboarding, safe to use money calculation, goal setup, daily money nudges, action buttons, AI coach chat, and weekly reflection. The objective is to validate the core loop:

User shares money basics → UrPaisa calculates safe to use money → user receives one useful action → user acts or skips → UrPaisa learns → weekly reflection improves future guidance.

### Phase 2: WhatsApp and Reminder Layer

After the mobile habit loop is validated, UrPaisa can expand into WhatsApp based nudges and smarter reminders. This will make the product more accessible in daily money moments such as salary day, bill due dates, weekend spending, and savings reminders.

This phase improves engagement and retention by meeting users where they already communicate.

### Phase 3: Advanced Financial Intelligence

Once trust and engagement are established, UrPaisa can evolve into a deeper financial intelligence platform. This phase can include bank integrations, automatic transaction categorization, subscription detection, debt payoff coaching, emergency mode, purchase decision support, AI Financial Twin simulations, and a web dashboard for monthly planning.

This phase turns UrPaisa from a money habit coach into a more complete personal finance intelligence layer.

## How This Maps to Existing Docs

- **Phase 1 = the entirety of `IMPLEMENTATION_PLAN.md` (Milestones 0–10)**, which builds out PRDs 00–09 (onboarding, financial model, safe-to-use money, goal/debt coach, nudges, habit learning, conversational mentor, reflections). No changes needed there — the milestone plan already matches this phase's scope.
- **Phase 2 (WhatsApp and Reminder Layer)** is not yet described by any PRD. Per the PRDs' own source-of-truth rule, this needs a dedicated PRD (e.g. `11-whatsapp-reminder-layer-prd.md`) written and approved before it gets broken into milestones — it should not be built from this roadmap summary alone.
- **Phase 3 (Advanced Financial Intelligence)** corresponds to Phase 3–4 in `PRDs/10-roadmap-advanced-features-prd.md` (bank integration, transaction categorization, subscription detection, AI Financial Twin, emergency mode, web dashboard) plus the debt-payoff-coaching depth already scoped in `PRDs/04-goal-and-debt-coach-prd.md`. Existing PRD 10 phase numbering (its own "Phase 2/3/4") predates this roadmap and should be treated as detail *within* this Roadmap's Phase 3, not as a separate sequence — worth updating PRD 10's phase labels to avoid two conflicting "Phase 2/3" numberings living in the repo at once.

## Confirmed Interpretation

"Mobile First MVP" means **mobile-first responsive web** (Next.js on Netlify, designed mobile-first), not a native app. No App Store/Play Store distribution in Phase 1. This keeps `TECH_STACK.md` unchanged. A native app can be revisited if Phase 3 or later demand justifies it.

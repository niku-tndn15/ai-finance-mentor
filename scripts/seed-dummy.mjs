// Seeds two dummy accounts for manual testing (run once; idempotent).
//   Account 1 — credentials only → login lands on /onboarding (the questions).
//   Account 2 — full financial model → login lands straight on /home.
//
// Run:  npx dotenv -e .env.local -- node scripts/seed-dummy.mjs
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const NEW = { email: "new@test.com", name: "New Tester", password: "Test1234" }
const DEMO = { email: "demo@test.com", name: "Demo Tester", password: "Test1234" }

async function main() {
  const now = new Date()

  // --- Account 1: fresh account, no plan yet → onboarding on login ---
  const newHash = await bcrypt.hash(NEW.password, 10)
  await prisma.user.upsert({
    where: { email: NEW.email },
    update: { name: NEW.name, passwordHash: newHash, emailVerifiedAt: now },
    create: { email: NEW.email, name: NEW.name, passwordHash: newHash, emailVerifiedAt: now },
  })

  // --- Account 2: complete account → /home on login ---
  const demoHash = await bcrypt.hash(DEMO.password, 10)
  const demo = await prisma.user.upsert({
    where: { email: DEMO.email },
    update: { name: DEMO.name, passwordHash: demoHash, emailVerifiedAt: now },
    create: { email: DEMO.email, name: DEMO.name, passwordHash: demoHash, emailVerifiedAt: now },
  })
  const userId = demo.id

  // Mirror app/api/financial-model/setup/route.ts: upsert Profile + Income,
  // wholesale-replace the list entities, all in one transaction.
  await prisma.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { userId },
      create: {
        userId,
        userType: "working_professional",
        incomeType: "fixed_salary",
        coachingTone: "friendly",
        primaryGoal: "Build a 6-month emergency fund",
      },
      update: {
        userType: "working_professional",
        incomeType: "fixed_salary",
        coachingTone: "friendly",
        primaryGoal: "Build a 6-month emergency fund",
      },
    })

    await tx.income.upsert({
      where: { userId },
      // fixed_salary → high stability (STABILITY_BY_INCOME_TYPE in setup route).
      create: { userId, monthlyAmount: 80000, payday: 1, plannedSavings: 15000, stability: "high" },
      update: { userId, monthlyAmount: 80000, payday: 1, plannedSavings: 15000, stability: "high" },
    })

    await Promise.all([
      tx.fixedExpense.deleteMany({ where: { userId } }),
      tx.subscription.deleteMany({ where: { userId } }),
      tx.goal.deleteMany({ where: { userId } }),
      tx.debt.deleteMany({ where: { userId } }),
    ])

    await tx.fixedExpense.createMany({
      data: [
        { userId, category: "Rent", amount: 22000, negotiability: "non_negotiable" },
        { userId, category: "Groceries", amount: 9000, negotiability: "semi_negotiable" },
        { userId, category: "Transport", amount: 4000, negotiability: "semi_negotiable" },
      ],
    })

    await tx.subscription.createMany({
      data: [
        { userId, name: "Netflix", amount: 649, negotiability: "semi_negotiable" },
        { userId, name: "Spotify", amount: 119, negotiability: "semi_negotiable" },
      ],
    })

    await tx.goal.createMany({
      data: [
        {
          userId,
          name: "Emergency fund",
          category: "emergency_fund",
          targetAmount: 240000,
          currentSavings: 60000,
          priority: 1,
          flexibility: "fixed",
          monthlyContribution: 10000,
        },
        {
          userId,
          name: "Goa trip",
          category: "lifestyle",
          targetAmount: 40000,
          currentSavings: 5000,
          priority: 2,
          flexibility: "flexible",
          monthlyContribution: 5000,
        },
      ],
    })

    await tx.debt.createMany({
      data: [
        {
          userId,
          type: "credit_card",
          outstanding: 35000,
          interestRate: 42.0,
          minimumPayment: 1750,
          lateFeeRisk: "high",
          stressLevel: "medium",
        },
      ],
    })
  })

  console.log("Seeded dummy accounts:")
  console.log(`  1) FRESH (→ onboarding): ${NEW.email}  /  ${NEW.password}`)
  console.log(`  2) COMPLETE (→ home):    ${DEMO.email}  /  ${DEMO.password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

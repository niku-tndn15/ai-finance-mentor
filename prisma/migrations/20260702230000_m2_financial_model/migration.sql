-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('working_professional', 'student_with_income', 'freelancer_gig', 'other');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('fixed_salary', 'variable_income', 'mixed_income');

-- CreateEnum
CREATE TYPE "IncomeStability" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "CoachingTone" AS ENUM ('friendly', 'direct', 'strict', 'calm', 'motivational');

-- CreateEnum
CREATE TYPE "ExpenseNegotiability" AS ENUM ('non_negotiable', 'semi_negotiable');

-- CreateEnum
CREATE TYPE "GoalFlexibility" AS ENUM ('fixed', 'flexible');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('credit_card', 'personal_loan', 'education_loan', 'vehicle_loan', 'bnpl', 'informal', 'other');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "incomeType" "IncomeType" NOT NULL,
    "coachingTone" "CoachingTone" NOT NULL,
    "primaryGoal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyAmount" INTEGER NOT NULL,
    "payday" INTEGER NOT NULL,
    "stability" "IncomeStability" NOT NULL,
    "plannedSavings" INTEGER NOT NULL DEFAULT 0,
    "irregularIncome" INTEGER,
    "bonusIncome" INTEGER,
    "expectedChange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "negotiability" "ExpenseNegotiability" NOT NULL DEFAULT 'non_negotiable',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "negotiability" "ExpenseNegotiability" NOT NULL DEFAULT 'semi_negotiable',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" INTEGER NOT NULL,
    "currentSavings" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "priority" INTEGER,
    "flexibility" "GoalFlexibility" NOT NULL DEFAULT 'flexible',
    "monthlyContribution" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DebtType" NOT NULL,
    "outstanding" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION,
    "minimumPayment" INTEGER,
    "dueDate" TIMESTAMP(3),
    "lateFeeRisk" "RiskLevel",
    "stressLevel" "RiskLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Income_userId_key" ON "Income"("userId");

-- CreateIndex
CREATE INDEX "FixedExpense_userId_idx" ON "FixedExpense"("userId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "Debt_userId_idx" ON "Debt"("userId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


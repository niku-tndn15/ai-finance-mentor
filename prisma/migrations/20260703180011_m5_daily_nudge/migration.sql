-- CreateEnum
CREATE TYPE "NudgeType" AS ENUM ('payday', 'weekend', 'subscription', 'goal', 'debt', 'impulse', 'low_money', 'safe_spend');

-- CreateTable
CREATE TABLE "Nudge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "forDate" DATE NOT NULL,
    "type" "NudgeType" NOT NULL,
    "trigger" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expectedBenefit" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "goalId" TEXT,
    "debtId" TEXT,
    "aiPhrased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nudge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Nudge_userId_idx" ON "Nudge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Nudge_userId_forDate_key" ON "Nudge"("userId", "forDate");

-- AddForeignKey
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

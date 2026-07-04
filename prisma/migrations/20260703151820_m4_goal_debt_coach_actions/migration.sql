-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('emergency_fund', 'essential_obligation', 'time_bound', 'lifestyle', 'investing');

-- CreateEnum
CREATE TYPE "ActionResponse" AS ENUM ('done', 'skipped', 'remind_later');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "category" "GoalCategory";

-- CreateTable
CREATE TABLE "ActionRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "response" "ActionResponse" NOT NULL,
    "remindAt" TIMESTAMP(3),
    "goalId" TEXT,
    "debtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionRecord_userId_createdAt_idx" ON "ActionRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionRecord_userId_category_idx" ON "ActionRecord"("userId", "category");

-- CreateIndex
CREATE INDEX "ActionRecord_userId_actionKey_idx" ON "ActionRecord"("userId", "actionKey");

-- AddForeignKey
ALTER TABLE "ActionRecord" ADD CONSTRAINT "ActionRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

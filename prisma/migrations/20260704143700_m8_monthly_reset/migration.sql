-- CreateTable
CREATE TABLE "MonthlyReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthStart" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "overspend" TEXT NOT NULL,
    "savings" TEXT NOT NULL,
    "biggestLeak" TEXT NOT NULL,
    "goalMovement" TEXT NOT NULL,
    "changeNextMonth" TEXT NOT NULL,
    "safeToUseNextMonth" INTEGER NOT NULL,
    "safeToUseSummary" TEXT NOT NULL,
    "nextAction" TEXT NOT NULL,
    "nextActionCategory" TEXT NOT NULL,
    "nextActionKey" TEXT NOT NULL,
    "aiPhrased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyReset_userId_idx" ON "MonthlyReset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReset_userId_monthStart_key" ON "MonthlyReset"("userId", "monthStart");

-- AddForeignKey
ALTER TABLE "MonthlyReset" ADD CONSTRAINT "MonthlyReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

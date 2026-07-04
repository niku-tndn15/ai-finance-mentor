-- CreateTable
CREATE TABLE "Reflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "completed" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "nextAction" TEXT NOT NULL,
    "nextActionCategory" TEXT NOT NULL,
    "nextActionKey" TEXT NOT NULL,
    "goalProgress" TEXT NOT NULL,
    "habitInsight" TEXT NOT NULL,
    "challengeTitle" TEXT,
    "challengeDetail" TEXT,
    "aiPhrased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reflection_userId_idx" ON "Reflection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reflection_userId_weekStart_key" ON "Reflection"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

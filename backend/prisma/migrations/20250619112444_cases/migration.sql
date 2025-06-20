-- CreateEnum
CREATE TYPE "advocate_case_outcome" AS ENUM ('WIN', 'LOSS', 'PENDING', 'SETTLED', 'DISMISSED');

-- CreateTable
CREATE TABLE "advocate_cases" (
    "case_id" UUID NOT NULL,
    "advocate_id" UUID NOT NULL,
    "case_type" "Specialization" NOT NULL,
    "role" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "outcome" "advocate_case_outcome" NOT NULL,
    "description" TEXT,
    "court_name" TEXT,
    "duration_months" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advocate_cases_pkey" PRIMARY KEY ("case_id")
);

-- AddForeignKey
ALTER TABLE "advocate_cases" ADD CONSTRAINT "advocate_cases_advocate_id_fkey" FOREIGN KEY ("advocate_id") REFERENCES "advocates"("advocate_id") ON DELETE RESTRICT ON UPDATE CASCADE;

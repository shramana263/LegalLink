-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('FRAUD', 'MISCONDUCT', 'FAKE_PROFILE', 'ABUSE', 'OTHER');

-- CreateTable
CREATE TABLE "advocate_reports" (
    "report_id" UUID NOT NULL,
    "advocate_id" UUID NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "category" "ReportCategory" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "action_taken" TEXT,

    CONSTRAINT "advocate_reports_pkey" PRIMARY KEY ("report_id")
);

-- AddForeignKey
ALTER TABLE "advocate_reports" ADD CONSTRAINT "advocate_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advocate_reports" ADD CONSTRAINT "advocate_reports_advocate_id_fkey" FOREIGN KEY ("advocate_id") REFERENCES "advocates"("advocate_id") ON DELETE CASCADE ON UPDATE CASCADE;

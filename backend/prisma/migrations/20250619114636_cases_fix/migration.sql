/*
  Warnings:

  - The values [WIN,LOSS] on the enum `advocate_case_outcome` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "advocate_case_outcome_new" AS ENUM ('WON', 'LOST', 'PENDING', 'SETTLED', 'DISMISSED');
ALTER TABLE "advocate_cases" ALTER COLUMN "outcome" TYPE "advocate_case_outcome_new" USING ("outcome"::text::"advocate_case_outcome_new");
ALTER TYPE "advocate_case_outcome" RENAME TO "advocate_case_outcome_old";
ALTER TYPE "advocate_case_outcome_new" RENAME TO "advocate_case_outcome";
DROP TYPE "advocate_case_outcome_old";
COMMIT;

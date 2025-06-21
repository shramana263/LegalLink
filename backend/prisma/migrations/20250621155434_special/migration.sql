-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Specialization" ADD VALUE 'AADHAAR_LAW';
ALTER TYPE "Specialization" ADD VALUE 'BIRTH_DEATH_MARRIAGE_REGISTRATION';
ALTER TYPE "Specialization" ADD VALUE 'CONSUMER_PROTECTION';
ALTER TYPE "Specialization" ADD VALUE 'CHILD_LAW';
ALTER TYPE "Specialization" ADD VALUE 'DOWRY_PROHIBITION';
ALTER TYPE "Specialization" ADD VALUE 'DRUG_AND_COSMETICS_LAW';

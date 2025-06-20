-- AlterTable
ALTER TABLE "advocates" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_status" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "contact_email" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "qualification" DROP NOT NULL,
ALTER COLUMN "experience_years" DROP NOT NULL,
ALTER COLUMN "profile_photo_url" DROP NOT NULL,
ALTER COLUMN "availability_status" DROP NOT NULL,
ALTER COLUMN "language_preferences" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "location_city" DROP NOT NULL,
ALTER COLUMN "jurisdiction_states" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "fee_structure" DROP NOT NULL;

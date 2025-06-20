-- CreateEnum
CREATE TYPE "Specialization" AS ENUM ('CRIMINAL', 'CIVIL', 'CORPORATE', 'FAMILY', 'CYBER', 'INTELLECTUAL_PROPERTY', 'TAXATION', 'LABOR', 'ENVIRONMENT', 'HUMAN_RIGHTS', 'OTHER');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "location" TEXT,
    "state" TEXT,
    "userType" TEXT DEFAULT 'client',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advocates" (
    "advocate_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "verification_document_url" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experience_years" INTEGER NOT NULL,
    "profile_photo_url" TEXT NOT NULL,
    "availability_status" BOOLEAN NOT NULL,
    "language_preferences" TEXT[],
    "location_city" TEXT NOT NULL,
    "jurisdiction_states" TEXT[],
    "fee_structure" JSONB NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "advocates_pkey" PRIMARY KEY ("advocate_id")
);

-- CreateTable
CREATE TABLE "advocate_specializations" (
    "id" UUID NOT NULL,
    "advocate_id" UUID NOT NULL,
    "specialization" "Specialization" NOT NULL,

    CONSTRAINT "advocate_specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advocate_ratings" (
    "rating_id" UUID NOT NULL,
    "advocate_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stars" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advocate_ratings_pkey" PRIMARY KEY ("rating_id")
);

-- CreateTable
CREATE TABLE "jurisdictions" (
    "jurisdiction_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "state_name" TEXT NOT NULL,
    "bench" TEXT,

    CONSTRAINT "jurisdictions_pkey" PRIMARY KEY ("jurisdiction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "advocates_userId_key" ON "advocates"("userId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advocates" ADD CONSTRAINT "advocates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advocate_specializations" ADD CONSTRAINT "advocate_specializations_advocate_id_fkey" FOREIGN KEY ("advocate_id") REFERENCES "advocates"("advocate_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advocate_ratings" ADD CONSTRAINT "advocate_ratings_advocate_id_fkey" FOREIGN KEY ("advocate_id") REFERENCES "advocates"("advocate_id") ON DELETE RESTRICT ON UPDATE CASCADE;

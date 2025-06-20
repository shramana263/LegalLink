/*
  Warnings:

  - You are about to drop the column `name` on the `advocates` table. All the data in the column will be lost.
  - You are about to drop the column `profile_photo_url` on the `advocates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "advocates" DROP COLUMN "name",
DROP COLUMN "profile_photo_url",
ALTER COLUMN "availability_status" SET DEFAULT true;

/*
  Warnings:

  - Added the required column `endsAt` to the `BloodDonationCamp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `BloodDonationCamp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BloodDonationCamp" ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "expectedDonors" INTEGER,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "HospitalProfile" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "BloodDonationCamp_startsAt_endsAt_idx" ON "BloodDonationCamp"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "HospitalProfile_approved_idx" ON "HospitalProfile"("approved");

/*
  Warnings:

  - You are about to drop the column `endsAt` on the `BloodDonationCamp` table. All the data in the column will be lost.
  - You are about to drop the column `expectedDonors` on the `BloodDonationCamp` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `BloodDonationCamp` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BloodDonationCamp" DROP CONSTRAINT "BloodDonationCamp_organizedByHospitalId_fkey";

-- DropForeignKey
ALTER TABLE "BloodInventory" DROP CONSTRAINT "BloodInventory_hospitalId_fkey";

-- DropForeignKey
ALTER TABLE "BloodRequest" DROP CONSTRAINT "BloodRequest_requestedByHospitalId_fkey";

-- DropForeignKey
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_donorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "DonationResponse" DROP CONSTRAINT "DonationResponse_bloodRequestId_fkey";

-- DropForeignKey
ALTER TABLE "DonationResponse" DROP CONSTRAINT "DonationResponse_donorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "DonorProfile" DROP CONSTRAINT "DonorProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "HospitalProfile" DROP CONSTRAINT "HospitalProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropIndex
DROP INDEX "BloodDonationCamp_startsAt_endsAt_idx";

-- AlterTable
ALTER TABLE "BloodDonationCamp" DROP COLUMN "endsAt",
DROP COLUMN "expectedDonors",
DROP COLUMN "startsAt";

-- AddForeignKey
ALTER TABLE "DonorProfile" ADD CONSTRAINT "DonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalProfile" ADD CONSTRAINT "HospitalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodInventory" ADD CONSTRAINT "BloodInventory_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_requestedByHospitalId_fkey" FOREIGN KEY ("requestedByHospitalId") REFERENCES "HospitalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDonationCamp" ADD CONSTRAINT "BloodDonationCamp_organizedByHospitalId_fkey" FOREIGN KEY ("organizedByHospitalId") REFERENCES "HospitalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationResponse" ADD CONSTRAINT "DonationResponse_bloodRequestId_fkey" FOREIGN KEY ("bloodRequestId") REFERENCES "BloodRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationResponse" ADD CONSTRAINT "DonationResponse_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

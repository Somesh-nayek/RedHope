-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HOSPITAL', 'DONOR', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "RequestUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'ACCEPTED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DONOR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "weightKg" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "lastDonationAt" TIMESTAMP(3),
    "emergencyContact" TEXT,
    "medicalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "emergencyContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodInventory" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "unitsAvailable" INTEGER NOT NULL DEFAULT 0,
    "unitsReserved" INTEGER NOT NULL DEFAULT 0,
    "minimumThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodRequest" (
    "id" TEXT NOT NULL,
    "requestedByHospitalId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "bloodGroup" "BloodGroup" NOT NULL,
    "unitsRequired" INTEGER NOT NULL,
    "unitsFulfilled" INTEGER NOT NULL DEFAULT 0,
    "urgency" "RequestUrgency" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "neededBy" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "patientName" TEXT,
    "patientAge" INTEGER,
    "contactNumber" TEXT NOT NULL,
    "locationCity" TEXT NOT NULL,
    "locationState" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodDonationCamp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizedByHospitalId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "expectedDonors" INTEGER,
    "contactNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodDonationCamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "campId" TEXT,
    "bloodRequestId" TEXT,
    "bloodGroup" "BloodGroup" NOT NULL,
    "unitsDonated" INTEGER NOT NULL,
    "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "screeningPassed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationResponse" (
    "id" TEXT NOT NULL,
    "bloodRequestId" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "donationId" TEXT,
    "status" "ResponseStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodRequestId" TEXT,
    "campId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DonorProfile_userId_key" ON "DonorProfile"("userId");

-- CreateIndex
CREATE INDEX "DonorProfile_bloodGroup_idx" ON "DonorProfile"("bloodGroup");

-- CreateIndex
CREATE INDEX "DonorProfile_city_state_idx" ON "DonorProfile"("city", "state");

-- CreateIndex
CREATE INDEX "DonorProfile_isEligible_idx" ON "DonorProfile"("isEligible");

-- CreateIndex
CREATE INDEX "DonorProfile_lastDonationAt_idx" ON "DonorProfile"("lastDonationAt");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalProfile_userId_key" ON "HospitalProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalProfile_licenseNumber_key" ON "HospitalProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "HospitalProfile_city_state_idx" ON "HospitalProfile"("city", "state");

-- CreateIndex
CREATE INDEX "HospitalProfile_hospitalName_idx" ON "HospitalProfile"("hospitalName");

-- CreateIndex
CREATE INDEX "BloodInventory_bloodGroup_idx" ON "BloodInventory"("bloodGroup");

-- CreateIndex
CREATE INDEX "BloodInventory_unitsAvailable_idx" ON "BloodInventory"("unitsAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "BloodInventory_hospitalId_bloodGroup_key" ON "BloodInventory"("hospitalId", "bloodGroup");

-- CreateIndex
CREATE INDEX "BloodRequest_status_idx" ON "BloodRequest"("status");

-- CreateIndex
CREATE INDEX "BloodRequest_urgency_idx" ON "BloodRequest"("urgency");

-- CreateIndex
CREATE INDEX "BloodRequest_bloodGroup_status_idx" ON "BloodRequest"("bloodGroup", "status");

-- CreateIndex
CREATE INDEX "BloodRequest_requestedByHospitalId_status_idx" ON "BloodRequest"("requestedByHospitalId", "status");

-- CreateIndex
CREATE INDEX "BloodRequest_neededBy_idx" ON "BloodRequest"("neededBy");

-- CreateIndex
CREATE INDEX "BloodDonationCamp_organizedByHospitalId_idx" ON "BloodDonationCamp"("organizedByHospitalId");

-- CreateIndex
CREATE INDEX "BloodDonationCamp_startsAt_endsAt_idx" ON "BloodDonationCamp"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BloodDonationCamp_city_state_idx" ON "BloodDonationCamp"("city", "state");

-- CreateIndex
CREATE INDEX "BloodDonationCamp_isActive_idx" ON "BloodDonationCamp"("isActive");

-- CreateIndex
CREATE INDEX "Donation_donorProfileId_donatedAt_idx" ON "Donation"("donorProfileId", "donatedAt");

-- CreateIndex
CREATE INDEX "Donation_hospitalId_idx" ON "Donation"("hospitalId");

-- CreateIndex
CREATE INDEX "Donation_campId_idx" ON "Donation"("campId");

-- CreateIndex
CREATE INDEX "Donation_bloodRequestId_idx" ON "Donation"("bloodRequestId");

-- CreateIndex
CREATE INDEX "Donation_bloodGroup_idx" ON "Donation"("bloodGroup");

-- CreateIndex
CREATE UNIQUE INDEX "DonationResponse_donationId_key" ON "DonationResponse"("donationId");

-- CreateIndex
CREATE INDEX "DonationResponse_status_idx" ON "DonationResponse"("status");

-- CreateIndex
CREATE INDEX "DonationResponse_bloodRequestId_status_idx" ON "DonationResponse"("bloodRequestId", "status");

-- CreateIndex
CREATE INDEX "DonationResponse_donorProfileId_idx" ON "DonationResponse"("donorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationResponse_bloodRequestId_donorProfileId_key" ON "DonationResponse"("bloodRequestId", "donorProfileId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- CreateIndex
CREATE INDEX "Notification_bloodRequestId_idx" ON "Notification"("bloodRequestId");

-- CreateIndex
CREATE INDEX "Notification_campId_idx" ON "Notification"("campId");

-- AddForeignKey
ALTER TABLE "DonorProfile" ADD CONSTRAINT "DonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalProfile" ADD CONSTRAINT "HospitalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodInventory" ADD CONSTRAINT "BloodInventory_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_requestedByHospitalId_fkey" FOREIGN KEY ("requestedByHospitalId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDonationCamp" ADD CONSTRAINT "BloodDonationCamp_organizedByHospitalId_fkey" FOREIGN KEY ("organizedByHospitalId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campId_fkey" FOREIGN KEY ("campId") REFERENCES "BloodDonationCamp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_bloodRequestId_fkey" FOREIGN KEY ("bloodRequestId") REFERENCES "BloodRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationResponse" ADD CONSTRAINT "DonationResponse_bloodRequestId_fkey" FOREIGN KEY ("bloodRequestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationResponse" ADD CONSTRAINT "DonationResponse_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationResponse" ADD CONSTRAINT "DonationResponse_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bloodRequestId_fkey" FOREIGN KEY ("bloodRequestId") REFERENCES "BloodRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_campId_fkey" FOREIGN KEY ("campId") REFERENCES "BloodDonationCamp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

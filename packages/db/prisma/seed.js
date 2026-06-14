"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const bloodGroups = [
    client_1.BloodGroup.A_POSITIVE,
    client_1.BloodGroup.A_NEGATIVE,
    client_1.BloodGroup.B_POSITIVE,
    client_1.BloodGroup.B_NEGATIVE,
    client_1.BloodGroup.AB_POSITIVE,
    client_1.BloodGroup.AB_NEGATIVE,
    client_1.BloodGroup.O_POSITIVE,
    client_1.BloodGroup.O_NEGATIVE
];
function getBloodGroup(index) {
    return bloodGroups[index % bloodGroups.length] ?? client_1.BloodGroup.O_POSITIVE;
}
async function main() {
    await prisma.notification.deleteMany();
    await prisma.donationResponse.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.bloodDonationCamp.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.bloodInventory.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.hospitalProfile.deleteMany();
    await prisma.user.deleteMany();
    const admin = await prisma.user.create({
        data: {
            email: 'admin@redhope.local',
            phoneNumber: '+910000000001',
            name: 'Red Hope Admin',
            passwordHash: 'seed-admin-password-hash',
            role: client_1.UserRole.ADMIN,
            status: client_1.UserStatus.ACTIVE
        }
    });
    const hospitalUsers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'citycare@redhope.local',
                phoneNumber: '+910000000101',
                name: 'CityCare Hospital',
                passwordHash: 'seed-hospital-password-hash',
                role: client_1.UserRole.HOSPITAL,
                status: client_1.UserStatus.ACTIVE
            }
        }),
        prisma.user.create({
            data: {
                email: 'lifeline@redhope.local',
                phoneNumber: '+910000000102',
                name: 'LifeLine Medical Center',
                passwordHash: 'seed-hospital-password-hash',
                role: client_1.UserRole.HOSPITAL,
                status: client_1.UserStatus.ACTIVE
            }
        })
    ]);
    const hospitalProfiles = await Promise.all([
        prisma.hospitalProfile.create({
            data: {
                userId: hospitalUsers[0].id,
                hospitalName: 'CityCare Hospital',
                licenseNumber: 'HC-RED-1001',
                contactNumber: '+91-11-40101010',
                address: '12 Connaught Place',
                city: 'Delhi',
                state: 'Delhi',
                postalCode: '110001',
                emergencyContact: '+91-11-40101011'
            }
        }),
        prisma.hospitalProfile.create({
            data: {
                userId: hospitalUsers[1].id,
                hospitalName: 'LifeLine Medical Center',
                licenseNumber: 'HC-RED-1002',
                contactNumber: '+91-80-40102020',
                address: '55 Residency Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                postalCode: '560025',
                emergencyContact: '+91-80-40102021'
            }
        })
    ]);
    for (const hospital of hospitalProfiles) {
        await prisma.bloodInventory.createMany({
            data: bloodGroups.map((bloodGroup, index) => ({
                hospitalId: hospital.id,
                bloodGroup,
                unitsAvailable: 8 + index,
                unitsReserved: index % 3,
                minimumThreshold: 5
            }))
        });
    }
    const donorSeedData = Array.from({ length: 10 }, (_, i) => ({
        email: `donor${i + 1}@redhope.local`,
        phoneNumber: `+9100000010${(i + 1).toString().padStart(2, '0')}`,
        name: `Donor ${i + 1}`,
        city: i % 2 === 0 ? 'Delhi' : 'Bengaluru',
        state: i % 2 === 0 ? 'Delhi' : 'Karnataka',
        postalCode: i % 2 === 0 ? '110001' : '560025',
        bloodGroup: getBloodGroup(i)
    }));
    const donorProfiles = [];
    for (const donor of donorSeedData) {
        const donorUser = await prisma.user.create({
            data: {
                email: donor.email,
                phoneNumber: donor.phoneNumber,
                name: donor.name,
                passwordHash: 'seed-donor-password-hash',
                role: client_1.UserRole.DONOR,
                status: client_1.UserStatus.ACTIVE
            }
        });
        const donorProfile = await prisma.donorProfile.create({
            data: {
                userId: donorUser.id,
                bloodGroup: donor.bloodGroup,
                city: donor.city,
                state: donor.state,
                postalCode: donor.postalCode,
                address: 'Seed Address',
                weightKg: 60 + (donorProfiles.length % 10),
                isEligible: true,
                emergencyContact: '+91-9999999999'
            }
        });
        donorProfiles.push(donorProfile);
    }
    const donorOne = donorProfiles[0];
    const donorTwo = donorProfiles[1];
    const donorThree = donorProfiles[2];
    if (!(donorOne && donorTwo && donorThree)) {
        throw new Error('Seed requires at least three donor profiles.');
    }
    const requests = await Promise.all([
        prisma.bloodRequest.create({
            data: {
                requestedByHospitalId: hospitalProfiles[0].id,
                createdByUserId: admin.id,
                bloodGroup: client_1.BloodGroup.O_NEGATIVE,
                unitsRequired: 4,
                unitsFulfilled: 1,
                urgency: client_1.RequestUrgency.CRITICAL,
                status: client_1.RequestStatus.ACCEPTED,
                neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
                reason: 'Trauma emergency',
                patientName: 'Patient A',
                patientAge: 34,
                contactNumber: '+91-11-40101010',
                locationCity: 'Delhi',
                locationState: 'Delhi'
            }
        }),
        prisma.bloodRequest.create({
            data: {
                requestedByHospitalId: hospitalProfiles[1].id,
                createdByUserId: admin.id,
                bloodGroup: client_1.BloodGroup.A_POSITIVE,
                unitsRequired: 6,
                urgency: client_1.RequestUrgency.HIGH,
                status: client_1.RequestStatus.OPEN,
                neededBy: new Date(Date.now() + 48 * 60 * 60 * 1000),
                reason: 'Scheduled surgery',
                patientName: 'Patient B',
                patientAge: 51,
                contactNumber: '+91-80-40102020',
                locationCity: 'Bengaluru',
                locationState: 'Karnataka'
            }
        }),
        prisma.bloodRequest.create({
            data: {
                requestedByHospitalId: hospitalProfiles[0].id,
                createdByUserId: admin.id,
                bloodGroup: client_1.BloodGroup.B_POSITIVE,
                unitsRequired: 3,
                unitsFulfilled: 3,
                urgency: client_1.RequestUrgency.MEDIUM,
                status: client_1.RequestStatus.FULFILLED,
                neededBy: new Date(Date.now() + 12 * 60 * 60 * 1000),
                reason: 'Post operative care',
                patientName: 'Patient C',
                patientAge: 26,
                contactNumber: '+91-11-40101010',
                locationCity: 'Delhi',
                locationState: 'Delhi'
            }
        })
    ]);
    const camps = await Promise.all([
        prisma.bloodDonationCamp.create({
            data: {
                name: 'Delhi Monsoon Blood Drive',
                description: 'Community blood donation camp in central Delhi.',
                organizedByHospitalId: hospitalProfiles[0].id,
                address: 'Central Park Ground',
                city: 'Delhi',
                state: 'Delhi',
                postalCode: '110001',
                startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
                expectedDonors: 150,
                contactNumber: '+91-11-40101010',
                isActive: true
            }
        }),
        prisma.bloodDonationCamp.create({
            data: {
                name: 'Bengaluru Tech Park Camp',
                description: 'Corporate volunteer donor camp.',
                organizedByHospitalId: hospitalProfiles[1].id,
                address: 'Manyata Tech Park Hall A',
                city: 'Bengaluru',
                state: 'Karnataka',
                postalCode: '560045',
                startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
                expectedDonors: 200,
                contactNumber: '+91-80-40102020',
                isActive: true
            }
        }),
        prisma.bloodDonationCamp.create({
            data: {
                name: 'Weekend Neighborhood Donation Camp',
                description: 'Weekend donation camp for local residents.',
                organizedByHospitalId: hospitalProfiles[0].id,
                address: 'Community Center Block B',
                city: 'Delhi',
                state: 'Delhi',
                postalCode: '110024',
                startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                endsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
                expectedDonors: 100,
                contactNumber: '+91-11-40101010',
                isActive: true
            }
        })
    ]);
    const firstDonation = await prisma.donation.create({
        data: {
            donorProfileId: donorOne.id,
            hospitalId: hospitalProfiles[0].id,
            campId: camps[0].id,
            bloodRequestId: requests[0].id,
            bloodGroup: donorOne.bloodGroup,
            unitsDonated: 1,
            screeningPassed: true
        }
    });
    await prisma.donationResponse.createMany({
        data: [
            {
                bloodRequestId: requests[0].id,
                donorProfileId: donorOne.id,
                donationId: firstDonation.id,
                status: client_1.ResponseStatus.COMPLETED,
                message: 'Donation completed at camp.'
            },
            {
                bloodRequestId: requests[1].id,
                donorProfileId: donorTwo.id,
                status: client_1.ResponseStatus.PENDING,
                message: 'Available for donation tomorrow.'
            },
            {
                bloodRequestId: requests[1].id,
                donorProfileId: donorThree.id,
                status: client_1.ResponseStatus.ACCEPTED,
                message: 'Accepted request and awaiting schedule.'
            }
        ]
    });
    await prisma.notification.createMany({
        data: [
            {
                userId: donorTwo.userId,
                bloodRequestId: requests[1].id,
                title: 'Urgent blood request nearby',
                message: 'A+ units are needed in Bengaluru.',
                isRead: false
            },
            {
                userId: hospitalUsers[0].id,
                bloodRequestId: requests[0].id,
                title: 'Donation completed',
                message: 'One unit has been fulfilled for critical request.',
                isRead: false
            },
            {
                userId: donorOne.userId,
                campId: camps[0].id,
                title: 'Camp reminder',
                message: 'Thank you for participating in the donation camp.',
                isRead: true
            }
        ]
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map
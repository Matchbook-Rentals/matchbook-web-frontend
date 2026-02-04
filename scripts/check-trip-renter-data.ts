import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRIP_ID = '76304515-112c-4f91-baba-ab960e5bfb5f';

async function checkTripRenterData() {
  console.log('\n=== Checking Trip Renter Data ===\n');
  console.log(`Trip ID: ${TRIP_ID}\n`);

  // Fetch the trip
  const trip = await prisma.trip.findUnique({
    where: { id: TRIP_ID },
    include: {
      applications: {
        include: {
          identifications: {
            include: {
              idPhotos: true
            }
          },
          incomes: true,
          residentialHistories: true
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!trip) {
    console.log('❌ Trip not found!');
    return;
  }

  console.log('--- Trip Info ---');
  console.log(`Status: ${trip.tripStatus}`);
  console.log(`Location: ${trip.locationString}`);
  console.log(`Start Date: ${trip.startDate}`);
  console.log(`End Date: ${trip.endDate}`);
  console.log(`User: ${trip.user.firstName} ${trip.user.lastName} (${trip.user.email})`);

  console.log('\n--- Applications ---');
  if (trip.applications.length === 0) {
    console.log('❌ No applications found for this trip!');
  } else {
    for (const app of trip.applications) {
      console.log(`\nApplication ID: ${app.id}`);
      console.log(`  isComplete: ${app.isComplete}`);
      console.log(`  isDefault: ${app.isDefault}`);
      console.log(`  Created: ${app.createdAt}`);

      console.log('\n  --- Personal Info ---');
      console.log(`  First Name: ${app.firstName || '❌ NULL'}`);
      console.log(`  Middle Name: ${app.middleName || '(none)'} ${app.noMiddleName ? '(no middle name checked)' : ''}`);
      console.log(`  Last Name: ${app.lastName || '❌ NULL'}`);
      console.log(`  Date of Birth: ${app.dateOfBirth || '❌ NULL'}`);

      console.log('\n  --- Background Questions ---');
      console.log(`  Evicted: ${app.evicted}`);
      console.log(`  Broken Lease: ${app.brokenLease}`);
      console.log(`  Felony: ${app.felony}`);
      console.log(`  Landlord Dispute: ${app.landlordDispute}`);

      console.log('\n  --- Identifications ---');
      if (app.identifications.length === 0) {
        console.log('  ❌ No identifications');
      } else {
        for (const id of app.identifications) {
          console.log(`  ID Type: ${id.idType || '❌ NULL'}`);
          console.log(`  ID Number: ${id.idNumber || '❌ NULL'}`);
          console.log(`  Is Primary: ${id.isPrimary}`);
          console.log(`  Photos: ${id.idPhotos.length > 0 ? `✅ ${id.idPhotos.length} photo(s)` : '❌ No photos'}`);
          if (id.idPhotos.length > 0) {
            for (const photo of id.idPhotos) {
              console.log(`    - Photo ID: ${photo.id}, fileKey: ${photo.fileKey ? '✅' : '❌'}, isPrimary: ${photo.isPrimary}`);
            }
          }
        }
      }

      console.log('\n  --- Incomes ---');
      if (app.incomes.length === 0) {
        console.log('  ❌ No income records');
      } else {
        for (const income of app.incomes) {
          console.log(`  Source: ${income.source || '❌ NULL'}`);
          console.log(`  Monthly Amount: ${income.monthlyAmount || '❌ NULL'}`);
          console.log(`  Has Document: ${income.fileKey ? '✅' : '❌'}`);
        }
      }

      console.log('\n  --- Residential Histories ---');
      if (app.residentialHistories.length === 0) {
        console.log('  ❌ No residential history');
      } else {
        for (const history of app.residentialHistories) {
          console.log(`  Address: ${history.address || '❌ NULL'}`);
          console.log(`  Start Date: ${history.startDate || '❌ NULL'}`);
          console.log(`  End Date: ${history.endDate || '(current)'}`);
        }
      }

      // Check completion status
      console.log('\n  === COMPLETION ANALYSIS ===');
      const missingFields: string[] = [];

      if (!app.firstName) missingFields.push('firstName');
      if (!app.lastName) missingFields.push('lastName');
      if (!app.dateOfBirth) missingFields.push('dateOfBirth');
      if (app.identifications.length === 0) {
        missingFields.push('identification');
      } else {
        const primaryId = app.identifications.find(i => i.isPrimary);
        if (!primaryId) missingFields.push('primary identification');
        else {
          if (!primaryId.idType) missingFields.push('idType');
          if (!primaryId.idNumber) missingFields.push('idNumber');
          if (primaryId.idPhotos.length === 0) missingFields.push('idPhotos');
        }
      }
      if (app.incomes.length === 0) missingFields.push('income');

      if (missingFields.length === 0) {
        console.log('  ✅ All required fields appear to be filled');
      } else {
        console.log(`  ❌ Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log(`\n  Database isComplete flag: ${app.isComplete ? '✅ TRUE' : '❌ FALSE'}`);
      if (missingFields.length > 0 && app.isComplete) {
        console.log('  ⚠️  WARNING: isComplete is TRUE but required fields are missing!');
      }
      if (missingFields.length === 0 && !app.isComplete) {
        console.log('  ⚠️  WARNING: All fields filled but isComplete is FALSE!');
      }
    }
  }

  // Also check for user's default application
  console.log('\n\n=== Checking User Default Application ===');
  const userApplications = await prisma.application.findMany({
    where: { userId: trip.userId },
    include: {
      identifications: {
        include: {
          idPhotos: true
        }
      },
      incomes: true,
      residentialHistories: true
    }
  });

  if (userApplications.length === 0) {
    console.log('❌ User has no applications at all!');
  } else {
    console.log(`User has ${userApplications.length} application(s):`);
    for (const app of userApplications) {
      console.log(`\n  Application ID: ${app.id}`);
      console.log(`  Trip ID: ${app.tripId || '(no trip - default)'}`);
      console.log(`  isDefault: ${app.isDefault}`);
      console.log(`  isComplete: ${app.isComplete}`);
      console.log(`  First Name: ${app.firstName || '❌ NULL'}`);
      console.log(`  Last Name: ${app.lastName || '❌ NULL'}`);
      console.log(`  DOB: ${app.dateOfBirth || '❌ NULL'}`);
      console.log(`  IDs: ${app.identifications.length}`);
      console.log(`  Incomes: ${app.incomes.length}`);
    }
  }

  await prisma.$disconnect();
}

checkTripRenterData().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});

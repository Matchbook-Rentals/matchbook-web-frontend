const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateReservationDeposit() {
  console.log('🚀 Starting migration of reservationDeposit to rentDueAtBooking...');
  
  try {
    // First, let's check the current state
    const listingsCount = await prisma.listing.count();
    const listingsWithReservationDeposit = await prisma.listing.count({
      where: {
        reservationDeposit: {
          not: null
        }
      }
    });
    const listingsWithRentDueAtBooking = await prisma.listing.count({
      where: {
        rentDueAtBooking: {
          not: null
        }
      }
    });

    console.log(`📊 Current state:`);
    console.log(`  - Total listings: ${listingsCount}`);
    console.log(`  - Listings with reservationDeposit: ${listingsWithReservationDeposit}`);
    console.log(`  - Listings with rentDueAtBooking: ${listingsWithRentDueAtBooking}`);

    // Find all listings where reservationDeposit is not null but rentDueAtBooking is null
    const listingsToMigrate = await prisma.listing.findMany({
      where: {
        reservationDeposit: {
          not: null
        },
        rentDueAtBooking: null
      },
      select: {
        id: true,
        reservationDeposit: true,
        rentDueAtBooking: true,
        locationString: true
      }
    });

    console.log(`\n🎯 Found ${listingsToMigrate.length} listings to migrate`);

    if (listingsToMigrate.length === 0) {
      console.log('✅ No listings need migration. All done!');
      return;
    }

    // Show some examples of what will be migrated
    console.log('\n📋 Examples of listings to migrate:');
    listingsToMigrate.slice(0, 5).forEach((listing, index) => {
      console.log(`  ${index + 1}. ${listing.locationString || 'Unknown location'}: $${listing.reservationDeposit} → rentDueAtBooking`);
    });

    // Perform the migration
    console.log('\n🔄 Starting migration...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const listing of listingsToMigrate) {
      try {
        await prisma.listing.update({
          where: {
            id: listing.id
          },
          data: {
            rentDueAtBooking: listing.reservationDeposit
          }
        });
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`  ✅ Migrated ${successCount} listings...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error migrating listing ${listing.id}:`, error.message);
      }
    }

    console.log(`\n📊 Migration completed for Listing model:`);
    console.log(`  ✅ Successfully migrated: ${successCount} listings`);
    console.log(`  ❌ Errors: ${errorCount} listings`);

    // Now migrate ListingInCreation
    console.log('\n🔄 Starting migration for ListingInCreation model...');
    
    const listingInCreationCount = await prisma.listingInCreation.count();
    const listingInCreationWithReservationDeposit = await prisma.listingInCreation.count({
      where: {
        reservationDeposit: {
          not: null
        }
      }
    });

    console.log(`📊 ListingInCreation current state:`);
    console.log(`  - Total drafts: ${listingInCreationCount}`);
    console.log(`  - Drafts with reservationDeposit: ${listingInCreationWithReservationDeposit}`);

    const draftsToMigrate = await prisma.listingInCreation.findMany({
      where: {
        reservationDeposit: {
          not: null
        },
        rentDueAtBooking: null
      },
      select: {
        id: true,
        reservationDeposit: true,
        rentDueAtBooking: true,
        title: true
      }
    });

    console.log(`\n🎯 Found ${draftsToMigrate.length} drafts to migrate`);

    let draftSuccessCount = 0;
    let draftErrorCount = 0;

    for (const draft of draftsToMigrate) {
      try {
        await prisma.listingInCreation.update({
          where: {
            id: draft.id
          },
          data: {
            rentDueAtBooking: draft.reservationDeposit
          }
        });
        draftSuccessCount++;
      } catch (error) {
        draftErrorCount++;
        console.error(`  ❌ Error migrating draft ${draft.id}:`, error.message);
      }
    }

    console.log(`\n📊 Migration completed for ListingInCreation model:`);
    console.log(`  ✅ Successfully migrated: ${draftSuccessCount} drafts`);
    console.log(`  ❌ Errors: ${draftErrorCount} drafts`);

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Final summary:`);
    console.log(`  - Listings migrated: ${successCount}`);
    console.log(`  - Drafts migrated: ${draftSuccessCount}`);
    console.log(`  - Total errors: ${errorCount + draftErrorCount}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateReservationDeposit().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
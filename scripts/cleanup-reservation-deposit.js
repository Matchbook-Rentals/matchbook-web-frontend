const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupReservationDeposit() {
  console.log('🧹 Starting cleanup of reservationDeposit fields...');
  console.log('⚠️  WARNING: This will permanently remove all reservationDeposit values!');
  console.log('   Make sure the frontend is updated to use rentDueAtBooking first.');
  
  // Add a safety check
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    readline.question('\n❓ Are you sure you want to proceed? Type "YES" to continue: ', resolve);
  });
  
  readline.close();

  if (answer !== 'YES') {
    console.log('❌ Cleanup cancelled by user.');
    return;
  }

  try {
    // First, verify that all reservationDeposit values have been copied to rentDueAtBooking
    console.log('\n🔍 Verifying data before cleanup...');
    
    const listingsWithReservationDepositOnly = await prisma.listing.count({
      where: {
        AND: [
          { reservationDeposit: { not: null } },
          { rentDueAtBooking: null }
        ]
      }
    });

    const draftsWithReservationDepositOnly = await prisma.listingInCreation.count({
      where: {
        AND: [
          { reservationDeposit: { not: null } },
          { rentDueAtBooking: null }
        ]
      }
    });

    if (listingsWithReservationDepositOnly > 0 || draftsWithReservationDepositOnly > 0) {
      console.log('❌ ERROR: Found unmigrated data!');
      console.log(`  - Listings with only reservationDeposit: ${listingsWithReservationDepositOnly}`);
      console.log(`  - Drafts with only reservationDeposit: ${draftsWithReservationDepositOnly}`);
      console.log('   Please run the migration script first before cleanup.');
      return;
    }

    // Get counts before cleanup
    const listingsWithReservationDeposit = await prisma.listing.count({
      where: {
        reservationDeposit: { not: null }
      }
    });

    const draftsWithReservationDeposit = await prisma.listingInCreation.count({
      where: {
        reservationDeposit: { not: null }
      }
    });

    console.log('\n📊 Found data to cleanup:');
    console.log(`  - Listings with reservationDeposit: ${listingsWithReservationDeposit}`);
    console.log(`  - Drafts with reservationDeposit: ${draftsWithReservationDeposit}`);

    if (listingsWithReservationDeposit === 0 && draftsWithReservationDeposit === 0) {
      console.log('✅ No data to cleanup. All reservationDeposit fields are already null.');
      return;
    }

    // Perform cleanup
    console.log('\n🧹 Starting cleanup...');

    // Clear reservationDeposit in Listing model
    const listingsUpdated = await prisma.listing.updateMany({
      where: {
        reservationDeposit: { not: null }
      },
      data: {
        reservationDeposit: null
      }
    });

    console.log(`✅ Cleared reservationDeposit from ${listingsUpdated.count} listings`);

    // Clear reservationDeposit in ListingInCreation model
    const draftsUpdated = await prisma.listingInCreation.updateMany({
      where: {
        reservationDeposit: { not: null }
      },
      data: {
        reservationDeposit: null
      }
    });

    console.log(`✅ Cleared reservationDeposit from ${draftsUpdated.count} drafts`);

    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    
    const remainingListings = await prisma.listing.count({
      where: {
        reservationDeposit: { not: null }
      }
    });

    const remainingDrafts = await prisma.listingInCreation.count({
      where: {
        reservationDeposit: { not: null }
      }
    });

    console.log(`📊 Verification results:`);
    console.log(`  - Remaining listings with reservationDeposit: ${remainingListings}`);
    console.log(`  - Remaining drafts with reservationDeposit: ${remainingDrafts}`);

    if (remainingListings === 0 && remainingDrafts === 0) {
      console.log('\n🎉 Cleanup completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`  - Cleared ${listingsUpdated.count} listing reservationDeposit values`);
      console.log(`  - Cleared ${draftsUpdated.count} draft reservationDeposit values`);
      console.log(`  - Total cleared: ${listingsUpdated.count + draftsUpdated.count} values`);
      console.log('\n✅ All reservationDeposit fields have been cleared.');
      console.log('   The reservationDeposit columns can now be safely removed from the schema.');
    } else {
      console.log('\n❌ Cleanup incomplete. Some values remain.');
    }

  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupReservationDeposit().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
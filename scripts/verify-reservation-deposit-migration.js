const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Starting verification of reservationDeposit to rentDueAtBooking migration...');
  
  try {
    // Check Listing model
    console.log('\n📋 Checking Listing model...');
    
    const listingsTotal = await prisma.listing.count();
    
    // Count different states
    const listingsWithBothValues = await prisma.listing.count({
      where: {
        AND: [
          { reservationDeposit: { not: null } },
          { rentDueAtBooking: { not: null } }
        ]
      }
    });
    
    const listingsWithOnlyReservationDeposit = await prisma.listing.count({
      where: {
        AND: [
          { reservationDeposit: { not: null } },
          { rentDueAtBooking: null }
        ]
      }
    });
    
    const listingsWithOnlyRentDueAtBooking = await prisma.listing.count({
      where: {
        AND: [
          { reservationDeposit: null },
          { rentDueAtBooking: { not: null } }
        ]
      }
    });
    
    const listingsWithNeither = await prisma.listing.count({
      where: {
        AND: [
          { reservationDeposit: null },
          { rentDueAtBooking: null }
        ]
      }
    });

    console.log(`📊 Listing verification results:`);
    console.log(`  - Total listings: ${listingsTotal}`);
    console.log(`  - With both values: ${listingsWithBothValues}`);
    console.log(`  - Only reservationDeposit: ${listingsWithOnlyReservationDeposit}`);
    console.log(`  - Only rentDueAtBooking: ${listingsWithOnlyRentDueAtBooking}`);
    console.log(`  - Neither value: ${listingsWithNeither}`);

    // Check for mismatched values
    const mismatchedListings = await prisma.listing.findMany({
      where: {
        AND: [
          { reservationDeposit: { not: null } },
          { rentDueAtBooking: { not: null } }
        ]
      },
      select: {
        id: true,
        reservationDeposit: true,
        rentDueAtBooking: true,
        locationString: true
      }
    });

    const actualMismatches = mismatchedListings.filter(
      listing => listing.reservationDeposit !== listing.rentDueAtBooking
    );

    console.log(`\n🔍 Value matching verification:`);
    console.log(`  - Listings with both values: ${mismatchedListings.length}`);
    console.log(`  - Mismatched values: ${actualMismatches.length}`);

    if (actualMismatches.length > 0) {
      console.log('\n❌ Found mismatched values:');
      actualMismatches.slice(0, 10).forEach((listing, index) => {
        console.log(`  ${index + 1}. ${listing.locationString || 'Unknown'}: reservationDeposit=$${listing.reservationDeposit}, rentDueAtBooking=$${listing.rentDueAtBooking}`);
      });
      if (actualMismatches.length > 10) {
        console.log(`  ... and ${actualMismatches.length - 10} more`);
      }
    } else {
      console.log('  ✅ All values match perfectly!');
    }

    // Check ListingInCreation model
    console.log('\n📋 Checking ListingInCreation model...');
    
    const draftsTotal = await prisma.listingInCreation.count();
    
    const draftsWithBothValues = await prisma.listingInCreation.count({
      where: {
        AND: [
          { reservationDeposit: { not: null } },
          { rentDueAtBooking: { not: null } }
        ]
      }
    });
    
    const draftsWithOnlyReservationDeposit = await prisma.listingInCreation.count({
      where: {
        AND: [
          { reservationDeposit: { not: null } },
          { rentDueAtBooking: null }
        ]
      }
    });
    
    const draftsWithOnlyRentDueAtBooking = await prisma.listingInCreation.count({
      where: {
        AND: [
          { reservationDeposit: null },
          { rentDueAtBooking: { not: null } }
        ]
      }
    });
    
    const draftsWithNeither = await prisma.listingInCreation.count({
      where: {
        AND: [
          { reservationDeposit: null },
          { rentDueAtBooking: null }
        ]
      }
    });

    console.log(`📊 ListingInCreation verification results:`);
    console.log(`  - Total drafts: ${draftsTotal}`);
    console.log(`  - With both values: ${draftsWithBothValues}`);
    console.log(`  - Only reservationDeposit: ${draftsWithOnlyReservationDeposit}`);
    console.log(`  - Only rentDueAtBooking: ${draftsWithOnlyRentDueAtBooking}`);
    console.log(`  - Neither value: ${draftsWithNeither}`);

    // Check for mismatched values in drafts
    const mismatchedDrafts = await prisma.listingInCreation.findMany({
      where: {
        AND: [
          { reservationDeposit: { not: null } },
          { rentDueAtBooking: { not: null } }
        ]
      },
      select: {
        id: true,
        reservationDeposit: true,
        rentDueAtBooking: true,
        title: true
      }
    });

    const actualDraftMismatches = mismatchedDrafts.filter(
      draft => draft.reservationDeposit !== draft.rentDueAtBooking
    );

    console.log(`\n🔍 Draft value matching verification:`);
    console.log(`  - Drafts with both values: ${mismatchedDrafts.length}`);
    console.log(`  - Mismatched values: ${actualDraftMismatches.length}`);

    if (actualDraftMismatches.length > 0) {
      console.log('\n❌ Found mismatched draft values:');
      actualDraftMismatches.slice(0, 10).forEach((draft, index) => {
        console.log(`  ${index + 1}. ${draft.title || 'Untitled'}: reservationDeposit=$${draft.reservationDeposit}, rentDueAtBooking=$${draft.rentDueAtBooking}`);
      });
    } else {
      console.log('  ✅ All draft values match perfectly!');
    }

    // Final summary
    console.log('\n🎉 Verification Summary:');
    console.log('='.repeat(50));
    
    const totalWithReservationDeposit = listingsWithBothValues + listingsWithOnlyReservationDeposit + draftsWithBothValues + draftsWithOnlyReservationDeposit;
    const totalWithRentDueAtBooking = listingsWithBothValues + listingsWithOnlyRentDueAtBooking + draftsWithBothValues + draftsWithOnlyRentDueAtBooking;
    const totalMigrated = listingsWithBothValues + draftsWithBothValues;
    const totalNotMigrated = listingsWithOnlyReservationDeposit + draftsWithOnlyReservationDeposit;
    const totalMismatches = actualMismatches.length + actualDraftMismatches.length;

    console.log(`📊 Overall Statistics:`);
    console.log(`  - Total records with reservationDeposit: ${totalWithReservationDeposit}`);
    console.log(`  - Total records with rentDueAtBooking: ${totalWithRentDueAtBooking}`);
    console.log(`  - Successfully migrated: ${totalMigrated}`);
    console.log(`  - Not yet migrated: ${totalNotMigrated}`);
    console.log(`  - Value mismatches: ${totalMismatches}`);

    if (totalNotMigrated > 0) {
      console.log('\n⚠️  WARNING: Some records still need migration!');
      console.log('   Run the migration script again to complete the process.');
    }

    if (totalMismatches > 0) {
      console.log('\n❌ ERROR: Found value mismatches!');
      console.log('   Please investigate and fix these inconsistencies.');
    }

    if (totalNotMigrated === 0 && totalMismatches === 0) {
      console.log('\n✅ SUCCESS: Migration is complete and all values match!');
      console.log(`   Ready to drop ${totalWithReservationDeposit} reservationDeposit values after frontend updates.`);
    }

  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyMigration().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
// Migration script for converting existing listings to new monthly pricing structure
// Use this TypeScript version for PlanetScale to avoid UUID() caching issues

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ListingData {
  id: string;
  shortestLeaseLength: number;
  longestLeaseLength: number;
  shortestLeasePrice: number;
  longestLeasePrice: number;
  utilitiesIncluded: boolean;
}

async function migrateListingPricing() {
  console.log('Starting listing pricing migration...');

  try {
    // Step 1: Get all existing listings
    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        shortestLeaseLength: true,
        longestLeaseLength: true,
        shortestLeasePrice: true,
        longestLeasePrice: true,
        utilitiesIncluded: true,
      },
    });

    console.log(`Found ${listings.length} listings to migrate`);

    // Step 2: Create monthly pricing records for each listing
    let totalRecordsCreated = 0;
    let listingsProcessed = 0;
    let listingsProcessedAtLastLog = 0;
    const startTime = Date.now();
    let lastProgressLog = startTime;

    for (const listing of listings) {
      const monthlyPricingData = [];

      // Generate pricing for each month in the lease range
      for (let month = listing.shortestLeaseLength; month <= listing.longestLeaseLength; month++) {
        let price: number;

        if (listing.shortestLeaseLength === listing.longestLeaseLength) {
          // Same lease length, use the short term price
          price = listing.shortestLeasePrice;
        } else if (month === listing.shortestLeaseLength) {
          // Shortest lease gets the short term price
          price = listing.shortestLeasePrice;
        } else if (month === listing.longestLeaseLength) {
          // Longest lease gets the long term price
          price = listing.longestLeasePrice;
        } else {
          // Linear interpolation for intermediate months
          const priceRange = listing.shortestLeasePrice - listing.longestLeasePrice;
          const leaseRange = listing.longestLeaseLength - listing.shortestLeaseLength;
          const monthsFromShortest = month - listing.shortestLeaseLength;
          price = Math.round(listing.shortestLeasePrice - (priceRange * monthsFromShortest / leaseRange));
        }

        // Handle edge cases for invalid pricing
        if (!price || price <= 0) {
          price = 2000; // Default fallback price
        }

        monthlyPricingData.push({
          listingId: listing.id,
          months: month,
          price: price,
          utilitiesIncluded: listing.utilitiesIncluded,
        });
      }

      // Check if pricing already exists for this listing
      const existingPricing = await prisma.listingMonthlyPricing.findMany({
        where: { listingId: listing.id },
        select: { months: true },
      });

      const existingMonths = new Set(existingPricing.map(p => p.months));

      // Filter out months that already have pricing
      const newPricingData = monthlyPricingData.filter(
        data => !existingMonths.has(data.months)
      );

      if (newPricingData.length > 0) {
        await prisma.listingMonthlyPricing.createMany({
          data: newPricingData,
          skipDuplicates: true,
        });

        totalRecordsCreated += newPricingData.length;
        console.log(`Created ${newPricingData.length} pricing records for listing ${listing.id}`);
      } else {
        console.log(`Skipped listing ${listing.id} - pricing already exists`);
      }

      listingsProcessed++;

      // Log progress every 120 seconds
      const currentTime = Date.now();
      if (currentTime - lastProgressLog >= 120000) { // 120 seconds = 120000ms
        const elapsedMinutes = Math.floor((currentTime - startTime) / 60000);
        const listingsPerMinute = Math.round(listingsProcessed / (elapsedMinutes || 1));
        const estimatedMinutesRemaining = Math.round((listings.length - listingsProcessed) / listingsPerMinute);
        
        // Calculate listings processed in last 120 seconds
        const listingsInLast120Seconds = listingsProcessed - listingsProcessedAtLastLog;
        
        console.log(`\n🕐 PROGRESS UPDATE - ${new Date().toLocaleTimeString()}`);
        console.log(`Processed: ${listingsProcessed}/${listings.length} listings (${Math.round(listingsProcessed/listings.length*100)}%)`);
        console.log(`Created: ${totalRecordsCreated} pricing records total`);
        console.log(`Rate: ~${listingsPerMinute} listings/minute`);
        console.log(`Listings in last 120s: ${listingsInLast120Seconds}`);
        console.log(`Estimated time remaining: ~${estimatedMinutesRemaining} minutes\n`);
        
        // Stop if processing less than 120 listings per 120 seconds
        if (listingsInLast120Seconds < 120) {
          console.log(`\n⚠️  WARNING: Processing rate too slow (${listingsInLast120Seconds} listings in last 120s)`);
          console.log(`Stopping migration to prevent timeout. Please run again to continue from where it left off.`);
          break;
        }
        
        listingsProcessedAtLastLog = listingsProcessed;
        lastProgressLog = currentTime;
      }
    }

    console.log(`Migration completed! Created ${totalRecordsCreated} total pricing records`);

    // Step 3: Validation - Check results
    await validateMigration();

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function validateMigration() {
  console.log('\n--- Validation Results ---');

  // Check total records created
  const totalRecords = await prisma.listingMonthlyPricing.count();
  const uniqueListings = await prisma.listingMonthlyPricing.groupBy({
    by: ['listingId'],
  });

  console.log(`Total monthly pricing records: ${totalRecords}`);
  console.log(`Unique listings with pricing: ${uniqueListings.length}`);

  // Check pricing distribution by month
  const pricingDistribution = await prisma.listingMonthlyPricing.groupBy({
    by: ['months'],
    _count: { _all: true },
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true },
    orderBy: { months: 'asc' },
  });

  console.log('\nPricing distribution by month:');
  pricingDistribution.forEach(dist => {
    console.log(`Month ${dist.months}: ${dist._count._all} listings, ` +
      `$${dist._min.price}-$${dist._max.price} (avg: $${Math.round(dist._avg.price || 0)})`);
  });

  // Check for listings without pricing
  const listingsWithoutPricing = await prisma.listing.findMany({
    where: {
      monthlyPricing: {
        none: {},
      },
    },
    select: {
      id: true,
      title: true,
      shortestLeaseLength: true,
      longestLeaseLength: true,
    },
  });

  if (listingsWithoutPricing.length > 0) {
    console.log(`\nWARNING: ${listingsWithoutPricing.length} listings have no pricing records:`);
    listingsWithoutPricing.forEach(listing => {
      console.log(`- ${listing.id}: ${listing.title} (${listing.shortestLeaseLength}-${listing.longestLeaseLength} months)`);
    });
  } else {
    console.log('\n✅ All listings have pricing records');
  }

  // Check for invalid pricing data
  const invalidPricing = await prisma.listingMonthlyPricing.findMany({
    where: {
      OR: [
        { price: { lte: 0 } },
        { months: { lt: 1 } },
        { months: { gt: 12 } },
      ],
    },
    include: {
      listing: {
        select: {
          title: true,
          shortestLeaseLength: true,
          longestLeaseLength: true,
        },
      },
    },
  });

  if (invalidPricing.length > 0) {
    console.log(`\nWARNING: Found ${invalidPricing.length} invalid pricing records:`);
    invalidPricing.forEach(record => {
      console.log(`- Listing: ${record.listing.title}, Month: ${record.months}, Price: $${record.price}`);
    });
  } else {
    console.log('\n✅ No invalid pricing data found');
  }
}

// Run the migration
if (require.main === module) {
  migrateListingPricing()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateListingPricing, validateMigration };
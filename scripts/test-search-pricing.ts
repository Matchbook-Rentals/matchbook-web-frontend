// Script to test search API pricing logic and identify the $0 pricing issue
// This reproduces the search flow and checks how prices are calculated

import { PrismaClient } from '@prisma/client';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

interface SearchResult {
  id: string;
  title: string;
  city: string | null;
  price?: number; // The optional 'price' field on the Listing model
  monthlyPricing: {
    months: number;
    price: number;
  }[];
}

async function testSearchPricing() {
  console.log('🔍 Testing Search Pricing Logic for Indianapolis...\n');

  try {
    // Simulate a search query - let's use sample dates
    const startDate = new Date('2025-03-01');
    const endDate = new Date('2025-09-01'); // 6 month trip
    const tripLengthDays = Math.max(1, differenceInDays(endDate, startDate));
    const tripLengthMonths = Math.max(1, Math.floor(tripLengthDays / 30.44));

    console.log(`📅 Trip Details:`);
    console.log(`   Start: ${startDate.toLocaleDateString()}`);
    console.log(`   End: ${endDate.toLocaleDateString()}`);
    console.log(`   Days: ${tripLengthDays}`);
    console.log(`   Months (calculated): ${tripLengthMonths}\n`);

    // Query Indianapolis listings like the search does
    const listings = await prisma.listing.findMany({
      where: {
        city: 'Indianapolis',
        deletedAt: null,
        approvalStatus: 'approved',
        markedActiveByUser: true,
        // This is the critical filter - only listings with pricing for this duration
        monthlyPricing: {
          some: {
            months: tripLengthMonths
          }
        }
      },
      select: {
        id: true,
        title: true,
        city: true,
        price: true, // <-- THIS IS THE ISSUE
        monthlyPricing: {
          select: {
            months: true,
            price: true,
          },
          orderBy: {
            months: 'asc'
          }
        }
      },
      take: 10 // Just first 10 for testing
    });

    console.log(`📊 Found ${listings.length} Indianapolis listings with ${tripLengthMonths}-month pricing\n`);

    // Analyze the pricing data
    console.log('═══════════════════════════════════════════════════════');
    console.log('  PRICING ANALYSIS');
    console.log('═══════════════════════════════════════════════════════\n');

    let withPriceField = 0;
    let withoutPriceField = 0;
    let withZeroPriceField = 0;

    listings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title.substring(0, 50)}...`);
      console.log(`   ID: ${listing.id}`);
      console.log(`   listing.price field: ${listing.price === null ? 'NULL' : listing.price === undefined ? 'UNDEFINED' : `$${(listing.price / 100).toFixed(2)}`}`);
      
      if (listing.price === null || listing.price === undefined) {
        console.log(`   ⚠️  ISSUE: listing.price is ${listing.price === null ? 'NULL' : 'UNDEFINED'}`);
        withoutPriceField++;
      } else if (listing.price === 0) {
        console.log(`   ⚠️  ISSUE: listing.price is $0.00`);
        withZeroPriceField++;
      } else {
        withPriceField++;
      }

      // Show monthly pricing data
      const matchingPricing = listing.monthlyPricing.find(p => p.months === tripLengthMonths);
      if (matchingPricing) {
        console.log(`   ✅ Monthly pricing for ${tripLengthMonths} months: $${(matchingPricing.price / 100).toFixed(2)}`);
      } else {
        console.log(`   ❌ No exact monthly pricing for ${tripLengthMonths} months`);
      }
      
      console.log(`   All monthly pricing tiers: ${listing.monthlyPricing.map(p => `${p.months}mo=$${(p.price / 100).toFixed(2)}`).join(', ')}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Listings with valid 'price' field: ${withPriceField}`);
    console.log(`Listings with NULL/UNDEFINED 'price' field: ${withoutPriceField}`);
    console.log(`Listings with $0 'price' field: ${withZeroPriceField}`);

    console.log('\n🔍 ROOT CAUSE ANALYSIS:\n');
    console.log('The issue is that the search query returns listings with:');
    console.log('1. Valid monthlyPricing data (from ListingMonthlyPricing table)');
    console.log('2. BUT the listing.price field (on the Listing table) is NULL/0');
    console.log('');
    console.log('The frontend cards are checking:');
    console.log('  - guest-search-listing-card.tsx line 90: calculateRent({ listing, trip })');
    console.log('  - search-listing-card.tsx line 247: listing.price?.toLocaleString() || 2350');
    console.log('');
    console.log('When the Listing.price field is NULL/undefined:');
    console.log('  - The old search card defaults to $2,350 (line 247)');
    console.log('  - The guest card uses calculateRent() which falls back properly');
    console.log('');
    console.log('SOLUTION: The search query needs to either:');
    console.log('  A) Calculate and set the "price" field based on trip duration');
    console.log('  B) Remove dependency on the deprecated "price" field entirely');
    console.log('  C) Run a migration to populate the "price" field from monthlyPricing');

  } catch (error) {
    console.error('❌ Error testing search pricing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  testSearchPricing()
    .then(() => {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testSearchPricing };

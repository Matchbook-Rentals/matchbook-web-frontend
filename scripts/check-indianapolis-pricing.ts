// Script to check monthly pricing data for Indianapolis listings
// This script identifies listings with $0/month pricing and provides detailed analysis

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ListingWithPricing = {
  id: string;
  title: string;
  city: string | null;
  state: string | null;
  status: string;
  isApproved: boolean;
  shortestLeaseLength: number;
  longestLeaseLength: number;
  shortestLeasePrice: number;
  longestLeasePrice: number;
  monthlyPricing: {
    months: number;
    price: number;
    utilitiesIncluded: boolean;
  }[];
};

async function checkIndianapolisPricing() {
  console.log('🔍 Checking pricing data for Indianapolis listings...\n');

  try {
    // Find all Indianapolis listings
    const indianapolisListings = await prisma.listing.findMany({
      where: {
        city: 'Indianapolis',
        deletedAt: null, // Exclude soft-deleted listings
      },
      include: {
        monthlyPricing: {
          select: {
            months: true,
            price: true,
            utilitiesIncluded: true,
          },
          orderBy: {
            months: 'asc',
          },
        },
      },
    });

    console.log(`📊 Total Indianapolis listings found: ${indianapolisListings.length}\n`);

    // Analyze pricing issues
    const listingsWithZeroPricing: typeof indianapolisListings = [];
    const listingsWithNoMonthlyPricing: typeof indianapolisListings = [];
    const listingsWithValidPricing: typeof indianapolisListings = [];
    const listingsWithLegacyZeroPricing: typeof indianapolisListings = [];

    for (const listing of indianapolisListings) {
      // Check for listings with no monthly pricing records
      if (listing.monthlyPricing.length === 0) {
        listingsWithNoMonthlyPricing.push(listing);
        
        // Also check if legacy pricing is zero
        if (listing.shortestLeasePrice === 0 || listing.longestLeasePrice === 0) {
          listingsWithLegacyZeroPricing.push(listing);
        }
      } else {
        // Check for listings with $0 monthly pricing
        const hasZeroPricing = listing.monthlyPricing.some(p => p.price === 0);
        
        if (hasZeroPricing) {
          listingsWithZeroPricing.push(listing);
        } else {
          listingsWithValidPricing.push(listing);
        }
      }
    }

    // Report summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('                    SUMMARY REPORT                      ');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`✅ Listings with valid pricing: ${listingsWithValidPricing.length}`);
    console.log(`⚠️  Listings with $0 monthly pricing: ${listingsWithZeroPricing.length}`);
    console.log(`⚠️  Listings with NO monthly pricing records: ${listingsWithNoMonthlyPricing.length}`);
    console.log(`❌ Listings with legacy $0 pricing: ${listingsWithLegacyZeroPricing.length}\n`);

    // Detailed breakdown of problematic listings
    if (listingsWithZeroPricing.length > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('  LISTINGS WITH $0 MONTHLY PRICING (NEW SYSTEM)');
      console.log('═══════════════════════════════════════════════════════\n');
      
      listingsWithZeroPricing.forEach(listing => {
        console.log(`ID: ${listing.id}`);
        console.log(`Title: ${listing.title}`);
        console.log(`Status: ${listing.status} | Approved: ${listing.isApproved}`);
        console.log(`Legacy Pricing: $${listing.shortestLeasePrice / 100} - $${listing.longestLeasePrice / 100}`);
        console.log('Monthly Pricing:');
        listing.monthlyPricing.forEach(p => {
          const priceDisplay = p.price === 0 ? '⚠️ $0.00' : `$${(p.price / 100).toFixed(2)}`;
          console.log(`  ${p.months} month(s): ${priceDisplay} (utilities: ${p.utilitiesIncluded ? 'YES' : 'NO'})`);
        });
        console.log('─────────────────────────────────────────────────────\n');
      });
    }

    if (listingsWithNoMonthlyPricing.length > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('  LISTINGS WITH NO MONTHLY PRICING RECORDS');
      console.log('═══════════════════════════════════════════════════════\n');
      
      listingsWithNoMonthlyPricing.forEach(listing => {
        console.log(`ID: ${listing.id}`);
        console.log(`Title: ${listing.title}`);
        console.log(`Status: ${listing.status} | Approved: ${listing.isApproved}`);
        console.log(`Legacy Pricing: $${listing.shortestLeasePrice / 100} - $${listing.longestLeasePrice / 100}`);
        console.log(`Lease Length: ${listing.shortestLeaseLength} - ${listing.longestLeaseLength} months`);
        console.log('⚠️  NO MONTHLY PRICING RECORDS FOUND');
        console.log('─────────────────────────────────────────────────────\n');
      });
    }

    // Price distribution analysis
    console.log('═══════════════════════════════════════════════════════');
    console.log('  PRICE DISTRIBUTION ANALYSIS (Valid Listings)');
    console.log('═══════════════════════════════════════════════════════\n');

    if (listingsWithValidPricing.length > 0) {
      const allPrices = listingsWithValidPricing
        .flatMap(l => l.monthlyPricing.map(p => p.price))
        .filter(p => p > 0);
      
      if (allPrices.length > 0) {
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
        
        console.log(`Minimum Price: $${(minPrice / 100).toFixed(2)}`);
        console.log(`Maximum Price: $${(maxPrice / 100).toFixed(2)}`);
        console.log(`Average Price: $${(avgPrice / 100).toFixed(2)}`);
        console.log(`Total Price Records: ${allPrices.length}\n`);
      }
    }

    // Export detailed CSV data
    console.log('═══════════════════════════════════════════════════════');
    console.log('  CSV EXPORT (All Indianapolis Listings)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('ID,Title,Status,Approved,LegacyMinPrice,LegacyMaxPrice,HasMonthlyPricing,ZeroPricingIssue');
    indianapolisListings.forEach(listing => {
      const hasMonthlyPricing = listing.monthlyPricing.length > 0;
      const hasZeroPricing = listing.monthlyPricing.some(p => p.price === 0);
      
      console.log([
        listing.id,
        `"${listing.title.replace(/"/g, '""')}"`,
        listing.status,
        listing.isApproved,
        listing.shortestLeasePrice,
        listing.longestLeasePrice,
        hasMonthlyPricing,
        hasZeroPricing || !hasMonthlyPricing,
      ].join(','));
    });

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error checking pricing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  checkIndianapolisPricing()
    .then(() => {
      console.log('Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { checkIndianapolisPricing };

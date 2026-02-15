// Script to verify matchesFilters() against real DB listings
// Mirrors the actual /search flow:
//   1. Haversine distance query for a specific city (like getListingsNearLocation)
//   2. Enrich listings the same way search-page-client.tsx does
//   3. Run matchesFilters() and compare against manual DB field checks
//
// Run with: npx tsx scripts/test-filter-logic.ts [city]
// Examples:
//   npx tsx scripts/test-filter-logic.ts            # defaults to Austin
//   npx tsx scripts/test-filter-logic.ts indianapolis

import { PrismaClient } from '@prisma/client';
import { matchesFilters, FilterOptions, ListingWithCalculations } from '../src/lib/listing-filters';
import { DEFAULT_FILTER_OPTIONS } from '../src/lib/consts/options';

const prisma = new PrismaClient();

// City presets (lat/lng matching what /search would use)
const CITIES: Record<string, { lat: number; lng: number; label: string }> = {
  austin:       { lat: 30.2672, lng: -97.7431, label: 'Austin, TX' },
  indianapolis: { lat: 39.7684, lng: -86.1581, label: 'Indianapolis, IN' },
  ogden:        { lat: 41.223,  lng: -111.9738, label: 'Ogden, UT' },
};

const PREFETCH_RADIUS_MILES = 25;
const PREFETCH_COUNT = 100;

interface TestCase {
  name: string;
  filters: FilterOptions;
  manualCheck: (listing: ListingWithCalculations) => boolean;
}

function buildFilters(overrides: Partial<FilterOptions>): FilterOptions {
  return { ...DEFAULT_FILTER_OPTIONS, ...overrides };
}

// In the real /search flow, isActuallyAvailable is always true (set in search-page-client.tsx:563)
// so the availability gate never filters anything out on the initial load.
const TEST_CASES: TestCase[] = [
  {
    name: '1. Property type: apartment only',
    filters: buildFilters({ propertyTypes: ['apartment'] }),
    manualCheck: (l) => l.category === 'apartment',
  },
  {
    name: '2. Property type: singleFamily only',
    filters: buildFilters({ propertyTypes: ['singleFamily'] }),
    manualCheck: (l) => l.category === 'singleFamily',
  },
  {
    name: '3. Price: $500-$1500 (range overlap)',
    filters: buildFilters({ minPrice: 500, maxPrice: 1500 }),
    manualCheck: (l) => {
      const min = l.calculatedPriceMin ?? 0;
      const max = l.calculatedPriceMax ?? 0;
      return max >= 500 && min <= 1500;
    },
  },
  {
    name: '4. Price: max $1000 (range overlap)',
    filters: buildFilters({ maxPrice: 1000 }),
    manualCheck: (l) => (l.calculatedPriceMin ?? 0) <= 1000,
  },
  {
    name: '5. Bedrooms: 2+',
    filters: buildFilters({ minBedrooms: 2 }),
    manualCheck: (l) => (l.bedrooms?.length || 0) >= 2,
  },
  {
    name: '6. Bathrooms: 2+',
    filters: buildFilters({ minBathrooms: 2 }),
    manualCheck: (l) => l.bathroomCount >= 2,
  },
  {
    name: '7. Furnished only',
    filters: buildFilters({ furnished: true }),
    manualCheck: (l) => l.furnished === true,
  },
  {
    name: '8. Unfurnished only',
    filters: buildFilters({ unfurnished: true }),
    manualCheck: (l) => l.furnished === false,
  },
  {
    name: '9. Pets allowed',
    filters: buildFilters({ pets: ['petsAllowed'] }),
    manualCheck: (l) => l.petsAllowed === true,
  },
  {
    name: '10. Pets not allowed',
    filters: buildFilters({ pets: ['petsNotAllowed'] }),
    manualCheck: (l) => l.petsAllowed === false,
  },
  {
    name: '11. Utilities included',
    filters: buildFilters({ utilities: ['utilitiesIncluded'] }),
    manualCheck: (l) => l.utilitiesIncluded === true,
  },
  {
    name: '12. Radius: 10 miles',
    filters: buildFilters({ searchRadius: 10 }),
    manualCheck: (l) =>
      l.distance === null || l.distance === undefined || l.distance <= 10,
  },
  {
    name: '13. WiFi required',
    filters: buildFilters({ basics: ['wifi'] }),
    manualCheck: (l) => (l as any).wifi === true,
  },
  {
    name: '14. Pool + gym',
    filters: buildFilters({ luxury: ['pool', 'gym'] }),
    manualCheck: (l) => (l as any).pool === true && (l as any).gym === true,
  },
  {
    name: '15. Washer in unit',
    filters: buildFilters({ laundry: ['washerInUnit'] }),
    manualCheck: (l) => (l as any).washerInUnit === true,
  },
  {
    name: '16. Wheelchair access',
    filters: buildFilters({ accessibility: ['wheelchairAccess'] }),
    manualCheck: (l) => (l as any).wheelchairAccess === true,
  },
  {
    name: '17. Garage parking',
    filters: buildFilters({ parking: ['garageParking'] }),
    manualCheck: (l) => (l as any).garageParking === true,
  },
  {
    name: '18. Dishwasher + fridge',
    filters: buildFilters({ kitchen: ['dishwasher', 'fridge'] }),
    manualCheck: (l) => (l as any).dishwasher === true && (l as any).fridge === true,
  },
  {
    name: '19. Combined: furnished apt, $500-$2000, 2+ bed, wifi',
    filters: buildFilters({
      propertyTypes: ['apartment'],
      furnished: true,
      minPrice: 500,
      maxPrice: 2000,
      minBedrooms: 2,
      basics: ['wifi'],
    }),
    manualCheck: (l) =>
      l.category === 'apartment' &&
      l.furnished === true &&
      (l.calculatedPriceMax ?? 0) >= 500 &&
      (l.calculatedPriceMin ?? 0) <= 2000 &&
      (l.bedrooms?.length || 0) >= 2 &&
      (l as any).wifi === true,
  },
  {
    name: '20. Default filters (should pass everything)',
    filters: { ...DEFAULT_FILTER_OPTIONS },
    manualCheck: () => true, // defaults are maximally inclusive, all should pass
  },
];

interface Mismatch {
  listingId: string;
  title: string;
  filterResult: boolean;
  manualResult: boolean;
  details: Record<string, any>;
}

function getRelevantDetails(listing: ListingWithCalculations, testCase: TestCase): Record<string, any> {
  const details: Record<string, any> = {};
  const f = testCase.filters;

  if (f.propertyTypes.length > 0) details.category = listing.category;
  if (f.minPrice !== null || f.maxPrice !== null) {
    details.calculatedPrice = listing.calculatedPrice;
    details.calculatedPriceMin = listing.calculatedPriceMin;
    details.calculatedPriceMax = listing.calculatedPriceMax;
  }
  if (f.minBedrooms > 0) details.bedroomCount = listing.bedrooms?.length || 0;
  if (f.minBathrooms > 0) details.bathroomCount = listing.bathroomCount;
  if (f.furnished || f.unfurnished) details.furnished = listing.furnished;
  if (f.utilities.length > 0) details.utilitiesIncluded = listing.utilitiesIncluded;
  if (f.pets.length > 0) details.petsAllowed = listing.petsAllowed;
  if (f.searchRadius < 100) details.distance = listing.distance;
  if (f.basics.length > 0) f.basics.forEach(b => details[b] = (listing as any)[b]);
  if (f.luxury.length > 0) f.luxury.forEach(b => details[b] = (listing as any)[b]);
  if (f.laundry.length > 0) f.laundry.forEach(b => details[b] = (listing as any)[b]);
  if (f.accessibility.length > 0) f.accessibility.forEach(b => details[b] = (listing as any)[b]);
  if (f.parking.length > 0) f.parking.forEach(b => details[b] = (listing as any)[b]);
  if (f.kitchen.length > 0) f.kitchen.forEach(b => details[b] = (listing as any)[b]);
  details.isActuallyAvailable = listing.isActuallyAvailable;

  return details;
}

async function main() {
  // Parse city from CLI args
  const cityArg = (process.argv[2] || 'austin').toLowerCase();
  const city = CITIES[cityArg];
  if (!city) {
    console.error(`Unknown city "${cityArg}". Available: ${Object.keys(CITIES).join(', ')}`);
    process.exit(1);
  }

  console.log(`=== matchesFilters() Verification — ${city.label} ===`);
  console.log(`Replicating /search flow: getListingsNearLocation(${city.lat}, ${city.lng}, ${PREFETCH_COUNT}, ${PREFETCH_RADIUS_MILES})\n`);

  // ---------------------------------------------------------------
  // Step 1: Same Haversine query as getListingsNearLocation()
  // (src/app/actions/listings.ts:1555-1614)
  // ---------------------------------------------------------------
  const earthRadiusMiles = 3959;
  const listingsWithDistance = await prisma.$queryRaw<{ id: string; distance: number }[]>`
    SELECT l.id,
      (${earthRadiusMiles} * acos(
        cos(radians(${city.lat})) * cos(radians(l.latitude)) *
        cos(radians(l.longitude) - radians(${city.lng})) +
        sin(radians(${city.lat})) * sin(radians(l.latitude))
      )) AS distance
    FROM Listing l
    WHERE l.approvalStatus = 'approved'
      AND l.markedActiveByUser = true
      AND l.deletedAt IS NULL
      AND l.latitude != 0
      AND l.longitude != 0
      AND EXISTS (
        SELECT 1 FROM ListingMonthlyPricing lmp
        WHERE lmp.listingId = l.id
      )
    HAVING distance <= ${PREFETCH_RADIUS_MILES}
    ORDER BY distance
    LIMIT ${PREFETCH_COUNT}
  `;

  if (listingsWithDistance.length === 0) {
    console.log('No listings found near this location. Try a different city.');
    return;
  }

  const listingIds = listingsWithDistance.map(l => l.id);
  const distanceMap = new Map(listingsWithDistance.map(l => [l.id, l.distance]));

  // Fetch full listings with includes (matches getListingsNearLocation)
  const rawListings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    include: {
      listingImages: { orderBy: { rank: 'asc' } },
      monthlyPricing: true,
      bedrooms: true,
      unavailablePeriods: true,
    },
  });

  console.log(`Fetched ${rawListings.length} listings within ${PREFETCH_RADIUS_MILES} miles of ${city.label}.\n`);

  // ---------------------------------------------------------------
  // Step 2: Enrich exactly like search-page-client.tsx does
  // - calculatedPrice = l.price  (line 573)
  // - isActuallyAvailable = true (line 563)
  // - distance from Haversine
  // ---------------------------------------------------------------
  const listings: ListingWithCalculations[] = rawListings.map((listing) => {
    const prices = listing.monthlyPricing?.map((p: any) => p.price) || [];
    const minP = prices.length ? Math.min(...prices) : ((listing as any).shortestLeasePrice || 0);
    const maxP = prices.length ? Math.max(...prices) : minP;
    return {
      ...listing,
      distance: distanceMap.get(listing.id) ?? undefined,
      calculatedPrice: listing.price ?? undefined,
      calculatedPriceMin: minP,
      calculatedPriceMax: maxP,
      isActuallyAvailable: true,
      listingImages: listing.listingImages || [],
    } as ListingWithCalculations;
  });

  // Quick stats
  const withPrice = listings.filter(l => l.calculatedPrice && l.calculatedPrice > 0).length;
  const withoutPrice = listings.length - withPrice;
  console.log(`Price field stats: ${withPrice} have price, ${withoutPrice} have null/0 price`);
  console.log('(In the real UI, calculatedPrice = listing.price — null/0 means $0 to the filter)\n');

  // ---------------------------------------------------------------
  // Step 3: Run test cases
  // ---------------------------------------------------------------
  let passCount = 0;
  let failCount = 0;

  for (const testCase of TEST_CASES) {
    const mismatches: Mismatch[] = [];
    let filterPassCount = 0;
    let manualPassCount = 0;

    for (const listing of listings) {
      const filterResult = matchesFilters(listing, testCase.filters);
      const manualResult = testCase.manualCheck(listing);

      if (filterResult) filterPassCount++;
      if (manualResult) manualPassCount++;

      if (filterResult !== manualResult) {
        mismatches.push({
          listingId: listing.id,
          title: listing.title?.substring(0, 40) || '(untitled)',
          filterResult,
          manualResult,
          details: getRelevantDetails(listing, testCase),
        });
      }
    }

    const passed = mismatches.length === 0;
    if (passed) passCount++;
    else failCount++;

    const status = passed ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${testCase.name}`);
    console.log(`       Total: ${listings.length} | Filter pass: ${filterPassCount} | Manual pass: ${manualPassCount} | Mismatches: ${mismatches.length}`);

    if (!passed) {
      const shown = mismatches.slice(0, 5);
      for (const m of shown) {
        console.log(`       MISMATCH ${m.listingId} "${m.title}" -> filter=${m.filterResult} manual=${m.manualResult}`);
        console.log(`         DB values: ${JSON.stringify(m.details)}`);
      }
      if (mismatches.length > 5) {
        console.log(`       ... and ${mismatches.length - 5} more mismatches`);
      }
    }

    console.log('');
  }

  // ---------------------------------------------------------------
  // Step 4: Summary
  // ---------------------------------------------------------------
  console.log('===================================');
  console.log(`  SUMMARY: ${passCount}/${TEST_CASES.length} tests passed`);
  if (failCount > 0) {
    console.log(`  ${failCount} test(s) FAILED - matchesFilters() disagrees with raw DB values`);
  } else {
    console.log('  All filters match expected behavior!');
  }
  console.log('===================================');
}

main()
  .catch((err) => {
    console.error('Script error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

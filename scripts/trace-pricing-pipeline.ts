/**
 * Pricing Pipeline Diagnostic Script
 * Traces data step-by-step from DB → query → calculateRent → display
 * Run: npx tsx scripts/trace-pricing-pipeline.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { calculateRent, calculateLengthOfStay } from '../src/lib/calculate-rent';

const prisma = new PrismaClient();

// Indianapolis coordinates
const LAT = 39.7684;
const LNG = -86.1581;
const RADIUS_MILES = 100;
const STATE = 'IN';
const EARTH_RADIUS_MILES = 3959;

// Simulated trip dates (3-month stay)
const START_DATE = new Date('2026-03-01');
const END_DATE = new Date('2026-06-01');

// Also test "no dates" scenario (what happens when guest has no dates set)
const NO_DATE_START = new Date(); // today
const NO_DATE_END = new Date();   // today (same day = 0 day trip)

async function step1_directDbCheck() {
  console.log('=== STEP 1: Direct DB check — Indianapolis listings with monthlyPricing ===\n');

  const listings = await prisma.listing.findMany({
    where: {
      city: 'Indianapolis',
      deletedAt: null,
      approvalStatus: 'approved',
      markedActiveByUser: true,
    },
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      shortestLeasePrice: true,
      longestLeasePrice: true,
      monthlyPricing: {
        select: {
          months: true,
          price: true,
          utilitiesIncluded: true,
        },
        orderBy: { months: 'asc' },
      },
    },
  });

  console.log(`Found ${listings.length} approved active Indianapolis listings\n`);

  for (const listing of listings) {
    console.log(`  ${listing.id} | "${listing.title}"`);
    console.log(`    Legacy prices: shortest=$${listing.shortestLeasePrice} longest=$${listing.longestLeasePrice}`);
    if (listing.monthlyPricing.length === 0) {
      console.log(`    monthlyPricing: EMPTY (no records)`);
    } else {
      for (const mp of listing.monthlyPricing) {
        console.log(`    monthlyPricing: ${mp.months}mo → $${mp.price} (utilities: ${mp.utilitiesIncluded})`);
      }
    }
    console.log('');
  }

  return listings;
}

async function step2_simulateQuery(startDate: Date, endDate: Date, label: string) {
  console.log(`=== STEP 2: Simulate pullGuestListingsFromDb (${label}) ===\n`);

  // This is exactly what pullGuestListingsFromDb does:
  const tripLengthDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const tripLengthMonths = Math.max(1, Math.floor(tripLengthDays / 30.44));

  console.log(`  Dates: ${startDate.toISOString()} → ${endDate.toISOString()}`);
  console.log(`  tripLengthDays: ${tripLengthDays}`);
  console.log(`  tripLengthMonths: ${tripLengthMonths}`);
  console.log('');

  // Step 2a: distance query (same as pullGuestListingsFromDb)
  const statesInRadius = ['IN', 'IL', 'OH', 'KY', 'MI']; // hardcode for IN
  const listingsWithDistance = await prisma.$queryRaw<{ id: string, distance: number }[]>`
    SELECT l.id,
    (${EARTH_RADIUS_MILES} * acos(
      cos(radians(${LAT})) * cos(radians(l.latitude)) *
      cos(radians(l.longitude) - radians(${LNG})) +
      sin(radians(${LAT})) * sin(radians(l.latitude))
    )) AS distance
    FROM Listing l
    WHERE l.state IN (${Prisma.join(statesInRadius)})
      AND l.approvalStatus = 'approved'
      AND l.markedActiveByUser = true
      AND l.deletedAt IS NULL
    HAVING distance <= ${RADIUS_MILES}
    ORDER BY distance
    LIMIT 100
  `;

  console.log(`  Distance query returned: ${listingsWithDistance.length} listings within ${RADIUS_MILES}mi\n`);

  // Step 2b: findMany with filters (same as pullGuestListingsFromDb)
  const listingIds = listingsWithDistance.map(l => l.id);
  const listings = await prisma.listing.findMany({
    where: {
      AND: [
        { deletedAt: null },
        { id: { in: listingIds } },
        {
          NOT: {
            unavailablePeriods: {
              some: {
                AND: [
                  { startDate: { lt: endDate } },
                  { endDate: { gt: startDate } }
                ]
              }
            }
          }
        },
        {
          NOT: {
            bookings: {
              some: {
                AND: [
                  { startDate: { lt: endDate } },
                  { endDate: { gt: startDate } },
                  { status: { in: ['reserved', 'pending_payment', 'confirmed', 'active'] } }
                ]
              }
            }
          }
        },
        {
          // THIS IS THE KEY FILTER — requires exact month match
          monthlyPricing: {
            some: {
              months: tripLengthMonths
            }
          }
        }
      ]
    },
    include: {
      listingImages: { orderBy: { rank: 'asc' } },
      monthlyPricing: true,
    }
  });

  console.log(`  After all filters (including monthlyPricing months=${tripLengthMonths}): ${listings.length} listings\n`);

  for (const listing of listings) {
    const dist = listingsWithDistance.find(l => l.id === listing.id)?.distance;
    const pricingStr = listing.monthlyPricing
      .map(mp => `${mp.months}mo=$${mp.price}`)
      .join(', ');
    console.log(`  ${listing.id} | "${listing.title}" | dist=${dist?.toFixed(1)}mi`);
    console.log(`    monthlyPricing: [${pricingStr}]`);
  }

  console.log('');
  return { listings, tripLengthMonths, tripLengthDays };
}

function step3_simulateContextProvider(
  listings: any[],
  sessionStartDate: Date | null | undefined,
  sessionEndDate: Date | null | undefined,
  label: string
) {
  console.log(`=== STEP 3: Simulate GuestTripContextProvider price calc (${label}) ===\n`);

  console.log(`  sessionData.searchParams.startDate = ${sessionStartDate}`);
  console.log(`  sessionData.searchParams.endDate = ${sessionEndDate}`);

  // This is exactly what the guest context provider does:
  const mockTrip = sessionStartDate && sessionEndDate
    ? { startDate: sessionStartDate, endDate: sessionEndDate } as any
    : null;

  console.log(`  mockTrip = ${mockTrip ? `{ startDate: ${mockTrip.startDate}, endDate: ${mockTrip.endDate} }` : 'null'}\n`);

  // Now simulate JSON serialization (server → client boundary)
  const serialized = JSON.parse(JSON.stringify(listings));
  console.log(`  After JSON round-trip: ${serialized.length} listings`);
  // Check if monthlyPricing survived
  const firstListing = serialized[0];
  if (firstListing) {
    console.log(`  First listing monthlyPricing type: ${typeof firstListing.monthlyPricing}, isArray: ${Array.isArray(firstListing.monthlyPricing)}, length: ${firstListing.monthlyPricing?.length}`);
  }
  console.log('');

  // Process each listing (exactly what our fix does)
  for (const listing of serialized) {
    let calculatedPrice: number;
    let source: string;

    if (mockTrip) {
      calculatedPrice = calculateRent({ listing, trip: mockTrip });
      source = 'calculateRent';
    } else {
      calculatedPrice = listing.monthlyPricing?.[0]?.price ?? 0;
      source = `fallback (monthlyPricing[0]=${listing.monthlyPricing?.[0]?.price}, length=${listing.monthlyPricing?.length})`;
    }

    const titleShort = listing.title?.substring(0, 40) || 'untitled';
    console.log(`  ${listing.id} | $${calculatedPrice} ← ${source} | "${titleShort}"`);
  }

  console.log('');
}

async function main() {
  try {
    await step1_directDbCheck();
    console.log('');

    // Test with "no dates" scenario first (most common guest case)
    const result1 = await step2_simulateQuery(NO_DATE_START, NO_DATE_END, 'no-dates fallback: today→today');
    step3_simulateContextProvider(result1.listings, null, null, 'dates=null (guest has no dates)');
    step3_simulateContextProvider(result1.listings, NO_DATE_START, NO_DATE_END, 'dates=today→today (same day)');
    console.log('');

    // Test with 3-month trip
    const result2 = await step2_simulateQuery(START_DATE, END_DATE, '3-month trip: Mar→Jun 2026');
    step3_simulateContextProvider(result2.listings, START_DATE, END_DATE, 'dates=Mar→Jun 2026');

    // Test with string dates (simulating Next.js serialization of session data)
    const stringStart = START_DATE.toISOString();
    const stringEnd = END_DATE.toISOString();
    step3_simulateContextProvider(result2.listings, stringStart as any, stringEnd as any, 'dates as ISO strings (post-serialization)');

    console.log('\n--- Steps 1-3 complete. ---\n');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

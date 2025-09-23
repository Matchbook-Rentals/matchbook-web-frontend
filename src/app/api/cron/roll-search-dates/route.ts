import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

/**
 * CRON JOB: Roll Search Dates
 *
 * Purpose:
 * This cron job automatically updates Trip searches that have dates in the past to keep them current and active.
 * When users create searches, they might set dates that become outdated over time. This job ensures searches
 * remain relevant by rolling forward outdated dates while preserving the user's intended search duration.
 *
 * Business Logic:
 * 1. FIND OUTDATED SEARCHES: Identifies trips where startDate <= today (includes past dates AND today)
 * 2. ROLL START DATE: Updates startDate to tomorrow for better search results
 * 3. PRESERVE DURATION: Maintains the original duration between start and end dates
 * 4. ADJUST END DATE: If rolling the start date causes the duration to shrink (especially across month boundaries),
 *    the end date is adjusted forward to maintain at least the original duration
 *
 * Example Scenarios:
 * - Search: Jan 14 → Feb 14 (31 days), Start date is today (Jan 14)
 *   Result: Jan 15 → Feb 15 (maintains 31+ days)
 *
 * - Search: Jan 10 → Jan 20 (10 days), Start date is past (Jan 10)
 *   Result: Tomorrow → Tomorrow + 10 days (preserves 10-day duration)
 *
 * - Search: Dec 31 → Jan 31 (31 days), Start date is today (Dec 31)
 *   Result: Jan 1 → Feb 1+ (ensures minimum 31-day duration across month boundary)
 *
 * Why This Matters:
 * - Keeps user searches active and relevant
 * - Prevents searches from becoming stale due to past dates
 * - Maintains user intent regarding search duration
 * - Enforces minimum 1 calendar month duration requirement
 * - Improves platform engagement by showing current results
 *
 * Testing:
 * - See test-calendar-month-logic.js for comprehensive test cases
 */

export async function GET(request: Request) {
  // Authorization check using cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron job access attempt - roll search dates');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Cron job: Starting search date rolling process...');

  try {
    const today = getToday();
    const tomorrow = getTomorrow();

    // Find all trips with start dates that are today or in the past
    const outdatedTrips = await findOutdatedTrips(today);

    if (outdatedTrips.length === 0) {
      console.log('Cron job: No trips found with outdated search dates.');
      return NextResponse.json({
        success: true,
        message: 'No outdated trips to update',
        processedTrips: 0
      });
    }

    console.log(`Cron job: Found ${outdatedTrips.length} trips with outdated dates to process.`);

    // Process each trip and prepare updates
    const tripUpdates = processTripsForDateRolling(outdatedTrips, tomorrow);

    // Execute all updates in batches for efficiency
    const updateResults = await executeTripsUpdate(tripUpdates);

    console.log(`Cron job: Successfully updated ${updateResults.count} trips with rolled dates.`);

    return NextResponse.json({
      success: true,
      processedTrips: updateResults.count,
      updatedTrips: tripUpdates.length,
      message: `Updated ${updateResults.count} trip search dates`
    });

  } catch (error) {
    console.error('Cron job: Error rolling search dates:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Get today's date at start of day (midnight UTC)
 */
const getToday = (): Date => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

/**
 * Get tomorrow's date at start of day (midnight UTC)
 */
const getTomorrow = (): Date => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
};

/**
 * Add exactly one calendar month to a date, handling month boundaries correctly
 * e.g., Jan 31 + 1 month = Feb 28/29 (not Mar 2/3)
 */
const addOneCalendarMonth = (date: Date): Date => {
  const newDate = new Date(date);
  const currentMonth = newDate.getUTCMonth();
  const currentDay = newDate.getUTCDate();

  // Add one month
  newDate.setUTCMonth(currentMonth + 1);

  // Handle edge case where the day doesn't exist in the next month
  // e.g., Jan 31 -> Feb 31 doesn't exist, so it becomes Feb 28/29
  if (newDate.getUTCDate() !== currentDay) {
    // JavaScript automatically rolled over to next month, so go back to last day of target month
    newDate.setUTCDate(0); // Sets to last day of previous month
  }

  return newDate;
};

/**
 * Find trips that have outdated start dates (today or in the past)
 */
const findOutdatedTrips = async (today: Date) => {
  return await prisma.trip.findMany({
    where: {
      startDate: {
        lte: today // Less than or equal to today (includes today and past dates)
      },
      // Only process trips that have both start and end dates
      AND: {
        startDate: { not: null },
        endDate: { not: null }
      }
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      userId: true
    }
  });
};

/**
 * Process trips to calculate new dates while preserving duration and enforcing minimum 1 calendar month
 */
const processTripsForDateRolling = (trips: any[], tomorrow: Date) => {
  return trips.map(trip => {
    const originalStartDate = new Date(trip.startDate);
    const originalEndDate = new Date(trip.endDate);

    // Calculate original duration in days (using Math.round to avoid extra days from Math.ceil)
    const originalDurationMs = originalEndDate.getTime() - originalStartDate.getTime();
    const originalDurationDays = Math.round(originalDurationMs / (1000 * 60 * 60 * 24));

    // New start date is tomorrow
    const newStartDate = new Date(tomorrow);

    // Calculate minimum end date (1 calendar month from new start)
    const minimumEndDate = addOneCalendarMonth(newStartDate);
    const minimumDurationDays = Math.round((minimumEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Determine the new end date:
    // - If original duration < 1 calendar month, expand to 1 calendar month
    // - Otherwise, preserve the original duration
    let newEndDate: Date;
    let durationEnforced = false;

    if (originalDurationDays < minimumDurationDays) {
      // Expand short searches to 1 calendar month minimum
      newEndDate = minimumEndDate;
      durationEnforced = true;
    } else {
      // Preserve original duration for searches already ≥ 1 month
      newEndDate = new Date(newStartDate);
      newEndDate.setUTCDate(newEndDate.getUTCDate() + originalDurationDays);
    }

    const newDurationDays = Math.round((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: trip.id,
      newStartDate,
      newEndDate,
      originalDurationDays,
      newDurationDays,
      durationEnforced,
      minimumDurationDays
    };
  });
};

/**
 * Execute the database updates for all processed trips
 */
const executeTripsUpdate = async (tripUpdates: any[]) => {
  // Process updates in batches to avoid timeout issues
  const BATCH_SIZE = 10;
  let totalUpdated = 0;

  for (let i = 0; i < tripUpdates.length; i += BATCH_SIZE) {
    const batch = tripUpdates.slice(i, i + BATCH_SIZE);

    // Use a transaction with increased timeout for each batch
    await prisma.$transaction(
      async (tx) => {
        const updatePromises = batch.map(update =>
          tx.trip.update({
            where: { id: update.id },
            data: {
              startDate: update.newStartDate,
              endDate: update.newEndDate,
              updatedAt: new Date()
            }
          })
        );

        await Promise.all(updatePromises);
      },
      {
        maxWait: 10000, // Max time to wait for a transaction slot (10 seconds)
        timeout: 30000, // Max time for the transaction to complete (30 seconds)
      }
    );

    totalUpdated += batch.length;

    // Log details about this batch
    const expandedTrips = batch.filter(update => update.durationEnforced);
    console.log(`Cron job: Updated batch ${Math.floor(i / BATCH_SIZE) + 1}, processed ${totalUpdated}/${tripUpdates.length} trips (${expandedTrips.length} expanded to 1 month minimum)`);
  }

  return { count: totalUpdated };
};
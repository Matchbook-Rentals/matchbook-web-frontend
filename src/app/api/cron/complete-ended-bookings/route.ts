import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

/**
 * CRON JOB: Complete Ended Bookings
 *
 * Purpose:
 * This cron job automatically transitions bookings to "completed" status
 * when their end date has passed.
 *
 * Business Logic:
 * 1. Finds bookings with status "active" or "confirmed" where endDate < today
 * 2. Updates their status to "completed"
 * 3. Records completion timestamp
 *
 * Safety Features:
 * - Only processes bookings that are in valid transition states
 * - Logs all transitions for audit purposes
 * - Does not affect cancelled bookings
 */

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron job access attempt - complete ended bookings');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Cron job: Starting ended bookings completion...');

  try {
    const todayMidnight = getTodayAtMidnight();

    console.log(`Looking for bookings with endDate < ${todayMidnight.toISOString()}`);

    const endedBookings = await findEndedBookings(todayMidnight);

    if (endedBookings.length === 0) {
      console.log('Cron job: No ended bookings to complete.');
      return NextResponse.json({
        success: true,
        message: 'No ended bookings to complete',
        completedBookings: 0
      });
    }

    console.log(`Cron job: Found ${endedBookings.length} ended bookings to complete.`);

    const results = await completeBookings(endedBookings);

    console.log(`Cron job: Booking completion done. Success: ${results.successful}, Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      completedBookings: results.successful,
      failedBookings: results.failed,
      message: `Completed ${results.successful} bookings, ${results.failed} failed`
    });

  } catch (error) {
    console.error('Cron job: Error completing ended bookings:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Get today's date at midnight UTC (using Pacific timezone for date determination)
 */
const getTodayAtMidnight = (): Date => {
  const now = new Date();
  const pacificDateString = now.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  const [month, day, year] = pacificDateString.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

/**
 * Find all bookings that have ended and need to be marked as completed
 */
const findEndedBookings = async (todayMidnight: Date) => {
  return await prisma.booking.findMany({
    where: {
      endDate: {
        lt: todayMidnight
      },
      status: {
        in: ['active', 'confirmed']
      }
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      listing: {
        select: {
          id: true,
          title: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }
    }
  });
};

/**
 * Update bookings to completed status
 */
const completeBookings = async (bookings: any[]) => {
  let successful = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'completed'
        }
      });

      console.log(`Completed booking ${booking.id} for ${booking.listing.title} (guest: ${booking.user.firstName} ${booking.user.lastName})`);
      successful++;
    } catch (error) {
      console.error(`Failed to complete booking ${booking.id}:`, error);
      failed++;
    }
  }

  return { successful, failed };
};

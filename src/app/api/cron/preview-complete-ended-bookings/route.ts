import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

/**
 * CRON JOB: Preview Complete Ended Bookings
 *
 * Purpose:
 * This endpoint previews which bookings would be marked as completed
 * without actually updating them. Use this before running the actual
 * complete-ended-bookings cron job to verify what will be affected.
 */

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron job access attempt - preview complete ended bookings');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Cron job: Previewing ended bookings completion...');

  try {
    const todayMidnight = getTodayAtMidnight();

    console.log(`Looking for bookings with endDate < ${todayMidnight.toISOString()}`);

    const endedBookings = await findEndedBookings(todayMidnight);

    const preview = endedBookings.map(booking => ({
      id: booking.id,
      status: booking.status,
      startDate: booking.startDate,
      endDate: booking.endDate,
      renter: {
        id: booking.user.id,
        name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim(),
        email: booking.user.email
      },
      listing: {
        id: booking.listing.id,
        title: booking.listing.title
      },
      host: {
        id: booking.listing.user.id,
        name: `${booking.listing.user.firstName || ''} ${booking.listing.user.lastName || ''}`.trim(),
        email: booking.listing.user.email
      }
    }));

    console.log(`Cron job: Found ${endedBookings.length} bookings that would be completed.`);

    return NextResponse.json({
      success: true,
      preview: true,
      message: `Found ${endedBookings.length} bookings that would be marked as completed`,
      cutoffDate: todayMidnight.toISOString(),
      bookingsCount: endedBookings.length,
      bookings: preview
    });

  } catch (error) {
    console.error('Cron job: Error previewing ended bookings:', error);
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
 * Find all bookings that have ended and would be marked as completed
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
    },
    orderBy: {
      endDate: 'asc'
    }
  });
};

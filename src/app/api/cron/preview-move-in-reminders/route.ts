import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

/**
 * Preview Move-In Reminder Notifications
 *
 * Runs to preview how many move-in reminder notifications will be sent
 * when the actual send-move-in-reminders cron job runs.
 *
 * Does NOT send any actual notifications - just returns a count and details
 * of what would be sent.
 */
export async function GET(request: Request) {
  console.log('👀 Starting preview-move-in-reminders cron job...');

  // Auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('⚠️ Unauthorized cron job access attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get the date range for bookings starting in 3 days
    const { threeDaysFromNow, fourDaysFromNow } = calculateDateRange();

    console.log(`📅 Preview: Looking for bookings with move-in date: ${threeDaysFromNow.toISOString()}`);

    // Find all bookings with move-in in 3 days
    const upcomingBookings = await findUpcomingBookings(threeDaysFromNow, fourDaysFromNow);

    console.log(`📦 Preview: Found ${upcomingBookings.length} bookings with move-in in 3 days`);

    // Build preview details
    const bookingDetails = upcomingBookings.map(booking => ({
      bookingId: booking.id,
      listingTitle: booking.listing.title,
      listingId: booking.listing.id,
      moveInDate: formatMoveInDate(booking.startDate),
      status: booking.status,
      renter: {
        id: booking.user.id,
        name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim(),
        email: booking.user.email
      },
      host: {
        id: booking.listing.user.id,
        name: `${booking.listing.user.firstName || ''} ${booking.listing.user.lastName || ''}`.trim(),
        email: booking.listing.user.email
      }
    }));

    // Calculate totals
    const totalRenterNotifications = upcomingBookings.length;
    const totalHostNotifications = upcomingBookings.length;
    const totalNotifications = totalRenterNotifications + totalHostNotifications;

    // Return preview summary
    const preview = {
      success: true,
      timestamp: new Date().toISOString(),
      targetMoveInDate: formatMoveInDate(threeDaysFromNow),
      summary: {
        bookingsFound: upcomingBookings.length,
        renterNotificationsToSend: totalRenterNotifications,
        hostNotificationsToSend: totalHostNotifications,
        totalNotificationsToSend: totalNotifications
      },
      bookings: bookingDetails
    };

    console.log('✅ Preview move-in reminders completed', {
      bookingsFound: upcomingBookings.length,
      totalNotifications
    });

    return NextResponse.json(preview);

  } catch (error) {
    console.error('❌ Error in preview-move-in-reminders cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate the date range for bookings starting in exactly 3 days
 * Uses Pacific timezone for consistency with business operations
 */
function calculateDateRange() {
  const now = new Date();

  // Get today's date in Pacific timezone
  const pacificDateString = now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles"
  });
  const [month, day, year] = pacificDateString.split('/').map(Number);

  // Create midnight UTC for today
  const todayMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  // Calculate 3 days from now (start of target day)
  const threeDaysFromNow = new Date(todayMidnight);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  // Calculate 4 days from now (end of target day)
  const fourDaysFromNow = new Date(todayMidnight);
  fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);

  return { threeDaysFromNow, fourDaysFromNow };
}

/**
 * Find all bookings with move-in date in 3 days
 */
async function findUpcomingBookings(threeDaysFromNow: Date, fourDaysFromNow: Date) {
  return await prisma.booking.findMany({
    where: {
      startDate: {
        gte: threeDaysFromNow,
        lt: fourDaysFromNow
      },
      status: {
        in: ['confirmed', 'reserved']
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
      startDate: 'asc'
    }
  });
}

/**
 * Format move-in date for display
 */
function formatMoveInDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

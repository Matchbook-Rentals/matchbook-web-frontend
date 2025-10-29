import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { createNotification } from '@/app/actions/notifications';
import { buildNotificationEmailData } from '@/lib/notification-builders';

/**
 * Send Move-In Reminder Notifications
 *
 * Runs daily to send move-in reminder notifications to renters and hosts
 * 3 days before the scheduled move-in date.
 *
 * Notifications sent:
 * - Renter: "Your booking starts in 3 days" with link to move-in instructions
 * - Host: "Guest arriving in 3 days" with link to booking details
 */
export async function GET(request: Request) {
  console.log('🏠 Starting send-move-in-reminders cron job...');

  // Auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('⚠️ Unauthorized cron job access attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get the date range for bookings starting in 3 days
    const { threeDaysFromNow, fourDaysFromNow } = calculateDateRange();

    console.log(`📅 Looking for bookings with move-in date: ${threeDaysFromNow.toISOString()}`);

    // Find all bookings with move-in in 3 days
    const upcomingBookings = await findUpcomingBookings(threeDaysFromNow, fourDaysFromNow);

    console.log(`📦 Found ${upcomingBookings.length} bookings with move-in in 3 days`);

    // Send notifications for each booking
    const results = await processBookings(upcomingBookings);

    // Return summary
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      bookingsProcessed: upcomingBookings.length,
      renterNotificationsSent: results.renterNotifications,
      hostNotificationsSent: results.hostNotifications,
      errors: results.errors
    };

    console.log('✅ Move-in reminders cron job completed successfully', summary);
    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ Error in send-move-in-reminders cron job:', error);
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
    }
  });
}

/**
 * Process all bookings and send notifications
 */
async function processBookings(bookings: any[]) {
  let renterNotifications = 0;
  let hostNotifications = 0;
  const errors: string[] = [];

  for (const booking of bookings) {
    try {
      // Send notification to renter
      const renterSuccess = await sendRenterNotification(booking);
      if (renterSuccess) renterNotifications++;

      // Send notification to host
      const hostSuccess = await sendHostNotification(booking);
      if (hostSuccess) hostNotifications++;

    } catch (error) {
      const errorMsg = `Failed to process booking ${booking.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      errors.push(errorMsg);
    }
  }

  return { renterNotifications, hostNotifications, errors };
}

/**
 * Send move-in reminder notification to renter
 */
async function sendRenterNotification(booking: any): Promise<boolean> {
  const moveInDate = formatMoveInDate(booking.startDate);

  console.log(`📧 Sending renter notification for booking ${booking.id} to ${booking.user.email}`);

  const result = await createNotification({
    userId: booking.user.id,
    actionType: 'move_in_upcoming',
    actionId: booking.id,
    content: `Your move-in to ${booking.listing.title} is in 3 days!`,
    url: `/app/rent/bookings/${booking.id}/move-in/instructions`,
    emailData: buildNotificationEmailData('move_in_upcoming', {
      listingTitle: booking.listing.title,
      bookingId: booking.id,
      moveInDate: moveInDate
    })
  });

  if (!result.success) {
    console.error(`❌ Failed to send renter notification for booking ${booking.id}:`, result.error);
    return false;
  }

  return true;
}

/**
 * Send move-in reminder notification to host
 */
async function sendHostNotification(booking: any): Promise<boolean> {
  const moveInDate = formatMoveInDate(booking.startDate);
  const renterName = booking.user.firstName || 'Your guest';

  console.log(`📧 Sending host notification for booking ${booking.id} to ${booking.listing.user.email}`);

  const result = await createNotification({
    userId: booking.listing.user.id,
    actionType: 'move_in_upcoming_host',
    actionId: booking.id,
    content: `${renterName}'s move-in to ${booking.listing.title} is in 3 days`,
    url: `/app/host/${booking.listing.id}/bookings/${booking.id}`,
    emailData: buildNotificationEmailData('move_in_upcoming_host', {
      listingTitle: booking.listing.title,
      renterName: renterName,
      listingId: booking.listing.id,
      bookingId: booking.id,
      moveInDate: moveInDate
    })
  });

  if (!result.success) {
    console.error(`❌ Failed to send host notification for booking ${booking.id}:`, result.error);
    return false;
  }

  return true;
}

/**
 * Format move-in date for display in notifications
 */
function formatMoveInDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

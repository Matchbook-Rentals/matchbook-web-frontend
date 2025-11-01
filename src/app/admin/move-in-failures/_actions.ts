'use server';

import prisma from '@/lib/prismadb';

export async function getMoveInFailures() {
  const bookings = await prisma.booking.findMany({
    where: {
      moveInStatus: 'issue_reported',
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
        },
      },
      rentPayments: {
        where: {
          status: 'FAILED_MOVE_IN',
        },
        select: {
          id: true,
          amount: true,
          dueDate: true,
        },
      },
    },
    orderBy: {
      moveInIssueReportedAt: 'desc',
    },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    renter: booking.user
      ? `${booking.user.firstName} ${booking.user.lastName}`
      : 'Unknown',
    renterEmail: booking.user?.email || 'N/A',
    listing: booking.listing.title,
    location: `${booking.listing.city}, ${booking.listing.state}`,
    startDate: booking.startDate,
    issueReportedAt: booking.moveInIssueReportedAt!,
    issueNotes: booking.moveInIssueNotes || 'No details provided',
    failedPaymentsCount: booking.rentPayments.length,
    failedPaymentsTotal: booking.rentPayments.reduce((sum, p) => sum + p.amount, 0),
  }));
}

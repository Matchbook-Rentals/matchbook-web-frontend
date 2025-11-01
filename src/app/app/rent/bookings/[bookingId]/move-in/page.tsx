import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prismadb';
import { checkRole } from '@/utils/roles';
import MoveInClient from './move-in-client';

interface MoveInPageProps {
  params: {
    bookingId: string;
  };
}

export default async function MoveInPage({ params }: MoveInPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch booking with necessary details
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      listing: true,
      rentPayments: {
        where: {
          type: 'MONTHLY_RENT',
          status: 'PENDING_MOVE_IN',
        },
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
  });

  if (!booking || booking.userId !== userId) {
    redirect('/app/rent/bookings');
  }

  // Check if already responded (either confirmed or reported issue)
  const hasResponded = booking.moveInStatus !== 'pending' && booking.moveInStatus !== null;

  // Check admin_dev role for testing tools
  const isAdminDev = await checkRole('admin_dev');

  return (
    <MoveInClient
      bookingId={booking.id}
      startDate={booking.startDate}
      listing={{
        title: booking.listing.title,
        address: booking.listing.streetAddress1 || '',
        city: booking.listing.city || '',
        state: booking.listing.state || '',
      }}
      hasPendingPayments={booking.rentPayments.length > 0}
      existingResponse={
        hasResponded
          ? {
              status: booking.moveInStatus as 'confirmed' | 'issue_reported',
              confirmedAt: booking.moveInConfirmedAt,
              issueReportedAt: booking.moveInIssueReportedAt,
              issueNotes: booking.moveInIssueNotes,
            }
          : null
      }
      isAdminDev={isAdminDev}
    />
  );
}

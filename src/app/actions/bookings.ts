'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { Booking, ListingUnavailability, Prisma, Notification  } from '@prisma/client'
import { createNotification } from './notifications'

// Create a new booking
// update the type to be a partial of booking
export async function createBooking(data: Prisma.BookingCreateInput): Promise<Booking> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // First get the match to get the tripId
  const match = await prisma.match.findUnique({
    where: {
      id: data.matchId as string
    },
    include: {
      listing: true,
      trip: true
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  const booking = await prisma.booking.create({
    data: {
      ...data,
      userId,
      tripId: match.tripId, // Add the tripId from the match
    },
  });

  const notificationData: Notification = {
    actionType: 'booking',
    actionId: booking.id,
    content: `You have a new booking for ${match?.listing.title} from ${match?.trip.startDate} to ${match?.trip.endDate}`,
    url: `/platform/host-dashboard/${match?.listing.id}?tab=bookings`,
    unread: true,
    userId: match?.listing.userId || null,
  }

  revalidatePath('/bookings');
  await createNotification(notificationData);

  return booking;
}

// Get a booking by ID
export async function getBooking(id: string): Promise<Booking | null> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return prisma.booking.findUnique({
    where: { id, userId },
  });
}

// Get all bookings for the current user
export async function getUserBookings() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        select: {
          title: true,
          imageSrc: true
        }
      },
      trip: {
        select: {
          numAdults: true,
          numPets: true,
          numChildren: true
        }
      }
    }
  });
}

// Update a booking
export async function updateBooking(id: string, data: Prisma.BookingUpdateInput): Promise<Booking> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const booking = await prisma.booking.update({
    where: { id, userId },
    data,
  });

  revalidatePath('/bookings');
  await createNotification({
    type: 'BOOKING_UPDATED',
    userId,
    bookingId: booking.id,
  });

  return booking;
}

// Delete a booking
export async function deleteBooking(id: string): Promise<void> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  await prisma.booking.delete({
    where: { id, userId },
  });

  revalidatePath('/bookings');
  await createNotification({
    type: 'BOOKING_DELETED',
    userId,
    bookingId: id,
  });
}


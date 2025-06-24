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

// Get all bookings for the current host's listings
export async function getHostBookings() {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('No userId found in auth for bookings');
      return []; // Return empty array instead of throwing error
    }

    console.log('Fetching bookings for userId:', userId);

    const bookings = await prisma.booking.findMany({
      where: { 
        listing: {
          userId: userId // Get bookings where the listing belongs to the current user (host)
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            title: true,
            imageSrc: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        trip: {
          select: {
            numAdults: true,
            numPets: true,
            numChildren: true
          }
        },
        match: {
          include: {
            BoldSignLease: true,
            Lease: true
          }
        }
      }
    });

    console.log('Found bookings:', bookings.length);
    return bookings;
  } catch (error) {
    console.error('Error in getHostBookings:', error);
    // Return empty array instead of throwing error to prevent page crash
    return [];
  }
}

// Get bookings for a specific listing (host must own the listing)
export async function getBookingsByListingId(listingId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('No userId found in auth for listing bookings');
      return []; // Return empty array instead of throwing error
    }

    console.log('Fetching bookings for listingId:', listingId, 'userId:', userId);

    // First verify the listing belongs to the current user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing || listing.userId !== userId) {
      console.log('Unauthorized to view bookings for this listing');
      return []; // Return empty array instead of throwing error
    }

    const bookings = await prisma.booking.findMany({
      where: { 
        listingId: listingId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            title: true,
            imageSrc: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        trip: {
          select: {
            numAdults: true,
            numPets: true,
            numChildren: true
          }
        },
        match: {
          include: {
            BoldSignLease: true,
            Lease: true
          }
        }
      }
    });

    console.log('Found bookings for listing:', bookings.length);
    return bookings;
  } catch (error) {
    console.error('Error in getBookingsByListingId:', error);
    // Return empty array instead of throwing error to prevent page crash
    return [];
  }
}


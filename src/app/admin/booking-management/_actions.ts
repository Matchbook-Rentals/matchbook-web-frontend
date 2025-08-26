'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { revalidatePath } from 'next/cache'
import { Booking, User, Listing, Trip, Match } from '@prisma/client'
import { createNotification } from '@/app/actions/notifications'

const DEFAULT_PAGE_SIZE = 20;

interface GetAllBookingsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string; // all, reserved, active, cancelled, completed
  startDate?: string;
  endDate?: string;
}

export interface BookingWithDetails extends Booking {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  listing: {
    id: string;
    title: string;
    imageSrc: string | null;
    streetAddress1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    };
  };
  trip: {
    id: string;
    numAdults: number;
    numPets: number;
    numChildren: number;
  } | null;
  match: {
    id: string;
    monthlyRent: number | null;
    paymentStatus: string | null;
  };
  rentPayments: {
    id: string;
    amount: number;
    dueDate: Date;
    isPaid: boolean;
  }[];
}

// Interface for matches awaiting signature (pending bookings)
export interface PendingBookingFromMatch {
  id: string; // This will be the match ID
  type: 'pending_signature';
  matchId: string;
  userId: string; // guest user ID
  listingId: string;
  tripId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number | null;
  totalPrice: number | null;
  status: 'awaiting_signature';
  createdAt: Date;
  moveInCompletedAt: Date | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  listing: {
    id: string;
    title: string;
    imageSrc: string | null;
    streetAddress1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    };
  };
  trip: {
    id: string;
    numAdults: number;
    numPets: number;
    numChildren: number;
  };
  match: {
    id: string;
    monthlyRent: number | null;
    paymentStatus: string | null;
    paymentAuthorizedAt: Date | null;
    tenantSignedAt: Date | null;
    landlordSignedAt: Date | null;
  };
  boldSignLease: {
    id: string;
    tenantSigned: boolean;
    landlordSigned: boolean;
  } | null;
  rentPayments: never[]; // No rent payments for pending bookings
}

export type CombinedBookingData = BookingWithDetails | PendingBookingFromMatch;

export async function getAllBookings({ 
  page = 1, 
  pageSize = DEFAULT_PAGE_SIZE,
  search = '',
  status = 'all',
  startDate,
  endDate
}: GetAllBookingsParams = {}) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const skip = (page - 1) * pageSize;

  // Build search conditions for both bookings and matches
  const searchConditions = search ? {
    OR: [
      // Search by guest name
      { 
        user: {
          OR: [
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } }
          ]
        }
      },
      // Search by host name
      {
        listing: {
          user: {
            OR: [
              { email: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } }
            ]
          }
        }
      },
      // Search by listing title
      { listing: { title: { contains: search } } },
      // Search by listing address
      { listing: { streetAddress1: { contains: search } } },
      { listing: { city: { contains: search } } },
      { listing: { state: { contains: search } } }
    ]
  } : {};

  // Date range conditions
  const dateConditions: any = {};
  if (startDate && endDate) {
    dateConditions.AND = [
      { startDate: { gte: new Date(startDate) } },
      { endDate: { lte: new Date(endDate) } }
    ];
  } else if (startDate) {
    dateConditions.startDate = { gte: new Date(startDate) };
  } else if (endDate) {
    dateConditions.endDate = { lte: new Date(endDate) };
  }

  // For trip date filtering, we need to use trip.startDate/endDate for matches
  const tripDateConditions: any = {};
  if (startDate && endDate) {
    tripDateConditions.AND = [
      { trip: { startDate: { gte: new Date(startDate) } } },
      { trip: { endDate: { lte: new Date(endDate) } } }
    ];
  } else if (startDate) {
    tripDateConditions.trip = { startDate: { gte: new Date(startDate) } };
  } else if (endDate) {
    tripDateConditions.trip = { endDate: { lte: new Date(endDate) } };
  }

  // Fetch actual bookings
  const bookingWhere: any = {
    ...searchConditions,
    ...dateConditions
  };

  // Status filter for actual bookings
  if (status !== 'all' && status !== 'awaiting_signature') {
    bookingWhere.status = status;
  }

  // Fetch pending bookings (matches awaiting signature)
  const matchWhere: any = {
    ...searchConditions,
    ...tripDateConditions,
    AND: [
      { paymentAuthorizedAt: { not: null } }, // Payment is authorized
      { booking: null }, // No booking exists yet
      {
        BoldSignLease: {
          tenantSigned: true, // Tenant has signed
          landlordSigned: false // Landlord hasn't signed yet
        }
      }
    ]
  };

  const shouldIncludeBookings = status === 'all' || (status !== 'awaiting_signature');
  const shouldIncludePending = status === 'all' || status === 'awaiting_signature';

  const [actualBookings, pendingMatches] = await Promise.all([
    // Fetch actual bookings
    shouldIncludeBookings ? prisma.booking.findMany({
      where: bookingWhere,
      orderBy: { createdAt: 'desc' },
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
            imageSrc: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        trip: {
          select: {
            id: true,
            numAdults: true,
            numPets: true,
            numChildren: true
          }
        },
        match: {
          select: {
            id: true,
            monthlyRent: true,
            paymentStatus: true
          }
        },
        rentPayments: {
          select: {
            id: true,
            amount: true,
            dueDate: true,
            isPaid: true
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    }) : [],
    
    // Fetch pending bookings (matches awaiting signature)
    shouldIncludePending ? prisma.match.findMany({
      where: matchWhere,
      orderBy: { paymentAuthorizedAt: 'desc' },
      include: {
        trip: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        listing: {
          select: {
            id: true,
            title: true,
            imageSrc: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        BoldSignLease: {
          select: {
            id: true,
            tenantSigned: true,
            landlordSigned: true
          }
        }
      }
    }) : []
  ]);

  // Transform pending matches to look like bookings
  const transformedPendingBookings: PendingBookingFromMatch[] = pendingMatches.map(match => ({
    id: match.id, // Use match ID as the booking ID
    type: 'pending_signature' as const,
    matchId: match.id,
    userId: match.trip.userId,
    listingId: match.listingId,
    tripId: match.tripId,
    startDate: match.trip.startDate!,
    endDate: match.trip.endDate!,
    monthlyRent: match.monthlyRent,
    totalPrice: null,
    status: 'awaiting_signature' as const,
    createdAt: match.paymentAuthorizedAt!,
    moveInCompletedAt: null,
    user: match.trip.user,
    listing: match.listing,
    trip: {
      id: match.trip.id,
      numAdults: match.trip.numAdults,
      numPets: match.trip.numPets,
      numChildren: match.trip.numChildren
    },
    match: {
      id: match.id,
      monthlyRent: match.monthlyRent,
      paymentStatus: match.paymentStatus,
      paymentAuthorizedAt: match.paymentAuthorizedAt,
      tenantSignedAt: match.tenantSignedAt,
      landlordSignedAt: match.landlordSignedAt
    },
    boldSignLease: match.BoldSignLease,
    rentPayments: []
  }));

  // Combine and sort all bookings by creation date
  const allBookings = [
    ...actualBookings as BookingWithDetails[],
    ...transformedPendingBookings
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply pagination to the combined results
  const paginatedBookings = allBookings.slice(skip, skip + pageSize);

  return { 
    bookings: paginatedBookings as CombinedBookingData[], 
    totalCount: allBookings.length 
  };
}

export async function getBookingDetails(bookingId: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  // First try to find an actual booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          fullName: true
        }
      },
      listing: {
        select: {
          id: true,
          title: true,
          imageSrc: true,
          streetAddress1: true,
          city: true,
          state: true,
          postalCode: true,
          roomCount: true,
          bathroomCount: true,
          category: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              fullName: true
            }
          }
        }
      },
      trip: {
        select: {
          id: true,
          numAdults: true,
          numPets: true,
          numChildren: true,
          startDate: true,
          endDate: true,
          locationString: true
        }
      },
      match: {
        select: {
          id: true,
          monthlyRent: true,
          paymentStatus: true,
          paymentAuthorizedAt: true,
          paymentCapturedAt: true,
          tenantSignedAt: true,
          landlordSignedAt: true
        }
      },
      rentPayments: {
        orderBy: { dueDate: 'asc' }
      },
      paymentTransactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (booking) {
    return booking;
  }

  // If no booking found, check if this is a match ID for a pending booking
  const match = await prisma.match.findUnique({
    where: { 
      id: bookingId,
      AND: [
        { paymentAuthorizedAt: { not: null } },
        { booking: null },
        {
          BoldSignLease: {
            tenantSigned: true,
            landlordSigned: false
          }
        }
      ]
    },
    include: {
      trip: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              fullName: true
            }
          }
        }
      },
      listing: {
        select: {
          id: true,
          title: true,
          imageSrc: true,
          streetAddress1: true,
          city: true,
          state: true,
          postalCode: true,
          roomCount: true,
          bathroomCount: true,
          category: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              fullName: true
            }
          }
        }
      },
      BoldSignLease: true,
      paymentTransactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (match) {
    // Transform match to look like a booking for the details page
    const pendingBooking = {
      id: match.id,
      type: 'pending_signature' as const,
      matchId: match.id,
      userId: match.trip.userId,
      listingId: match.listingId,
      tripId: match.tripId,
      startDate: match.trip.startDate!,
      endDate: match.trip.endDate!,
      monthlyRent: match.monthlyRent,
      totalPrice: null,
      status: 'awaiting_signature' as const,
      createdAt: match.paymentAuthorizedAt!,
      updatedAt: match.paymentAuthorizedAt!,
      moveInCompletedAt: null,
      user: match.trip.user,
      listing: match.listing,
      trip: {
        id: match.trip.id,
        numAdults: match.trip.numAdults,
        numPets: match.trip.numPets,
        numChildren: match.trip.numChildren,
        startDate: match.trip.startDate,
        endDate: match.trip.endDate,
        locationString: match.trip.locationString
      },
      match: {
        id: match.id,
        monthlyRent: match.monthlyRent,
        paymentStatus: match.paymentStatus,
        paymentAuthorizedAt: match.paymentAuthorizedAt,
        paymentCapturedAt: match.paymentCapturedAt,
        tenantSignedAt: match.tenantSignedAt,
        landlordSignedAt: match.landlordSignedAt
      },
      boldSignLease: match.BoldSignLease,
      rentPayments: [],
      paymentTransactions: match.paymentTransactions
    };

    return pendingBooking;
  }

  return null;
}

export async function cancelBooking(bookingId: string, reason: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      listing: { 
        select: { 
          id: true, 
          title: true,
          user: { select: { id: true } }
        } 
      }
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Update booking status to cancelled
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { 
      status: 'cancelled',
      updatedAt: new Date()
    }
  });

  // Cancel any unpaid rent payments
  await prisma.rentPayment.updateMany({
    where: { 
      bookingId: bookingId,
      isPaid: false
    },
    data: { 
      updatedAt: new Date()
      // Note: We're not deleting payments to maintain audit trail
    }
  });

  // Create notifications for both guest and host
  await Promise.all([
    createNotification({
      actionType: 'booking_cancelled',
      actionId: bookingId,
      content: `Your booking for ${booking.listing.title} has been cancelled by an administrator. Reason: ${reason}`,
      url: `/app/renter/bookings`,
      unread: true,
      userId: booking.userId,
    }),
    createNotification({
      actionType: 'booking_cancelled',
      actionId: bookingId,
      content: `The booking for ${booking.listing.title} by ${booking.user.firstName} ${booking.user.lastName} has been cancelled by an administrator.`,
      url: `/app/host-dashboard/${booking.listing.id}?tab=bookings`,
      unread: true,
      userId: booking.listing.user.id,
    })
  ]);

  revalidatePath('/admin/booking-management');
  revalidatePath(`/admin/booking-management/${bookingId}`);

  return updatedBooking;
}

export async function updateBookingDetails(bookingId: string, updates: {
  startDate?: Date;
  endDate?: Date;
  monthlyRent?: number;
  status?: string;
}) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      match: true,
      user: { select: { firstName: true, lastName: true } },
      listing: { 
        select: { 
          title: true,
          user: { select: { id: true } }
        } 
      }
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Update booking
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });

  // If monthly rent changed, update the match as well
  if (updates.monthlyRent && booking.match) {
    await prisma.match.update({
      where: { id: booking.match.id },
      data: { monthlyRent: updates.monthlyRent }
    });
  }

  // Create notification for guest about the update
  const changesList = [];
  if (updates.startDate) changesList.push(`start date to ${updates.startDate.toLocaleDateString()}`);
  if (updates.endDate) changesList.push(`end date to ${updates.endDate.toLocaleDateString()}`);
  if (updates.monthlyRent) changesList.push(`monthly rent to $${updates.monthlyRent}`);
  if (updates.status) changesList.push(`status to ${updates.status}`);

  if (changesList.length > 0) {
    await createNotification({
      actionType: 'booking_updated',
      actionId: bookingId,
      content: `Your booking for ${booking.listing.title} has been updated: ${changesList.join(', ')}.`,
      url: `/app/renter/bookings`,
      unread: true,
      userId: booking.userId,
    });

    // Notify host as well
    await createNotification({
      actionType: 'booking_updated',
      actionId: bookingId,
      content: `The booking for ${booking.listing.title} by ${booking.user.firstName} ${booking.user.lastName} has been updated by an administrator.`,
      url: `/app/host-dashboard/${booking.listing.id}?tab=bookings`,
      unread: true,
      userId: booking.listing.user.id,
    });
  }

  revalidatePath('/admin/booking-management');
  revalidatePath(`/admin/booking-management/${bookingId}`);

  return updatedBooking;
}

export async function revertBookingToMatch(bookingId: string, reason: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  console.log(`🔄 Starting revert process for booking: ${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      match: true,
      user: { select: { id: true, firstName: true, lastName: true } },
      listing: { 
        select: { 
          id: true, 
          title: true,
          user: { select: { id: true } }
        } 
      },
      rentPayments: true,
      paymentTransactions: true // Also include payment transactions that might reference this booking
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (!booking.match) {
    throw new Error('No associated match found for this booking');
  }

  console.log(`📊 Found booking with ${booking.rentPayments.length} rent payments and ${booking.paymentTransactions.length} payment transactions`);

  // Check if there are any paid rent payments
  const paidPayments = booking.rentPayments.filter(payment => payment.isPaid);
  if (paidPayments.length > 0) {
    throw new Error('Cannot revert booking with paid rent payments. Please handle refunds first.');
  }

  // Start transaction to revert booking
  try {
    await prisma.$transaction(async (tx) => {
      console.log(`🗑️ Deleting ${booking.rentPayments.length} rent payments for booking ${bookingId}`);
      
      // First, delete any payment transactions that reference this booking
      const paymentTransactionsResult = await tx.paymentTransaction.deleteMany({
        where: { bookingId: bookingId }
      });
      console.log(`🗑️ Deleted ${paymentTransactionsResult.count} payment transactions`);

      // Delete all rent payments (paid and unpaid) since we're reverting the entire booking
      const rentPaymentsResult = await tx.rentPayment.deleteMany({
        where: { bookingId: bookingId }
      });
      console.log(`🗑️ Deleted ${rentPaymentsResult.count} rent payments`);

      // Delete the booking
      console.log(`🗑️ Deleting booking ${bookingId}`);
      await tx.booking.delete({
        where: { id: bookingId }
      });
      console.log(`✅ Successfully deleted booking ${bookingId}`);

      // The match should remain as-is - no changes needed to the match record
    });

    console.log(`✅ Transaction completed successfully for booking ${bookingId}`);

    // Create notifications
    await Promise.all([
      createNotification({
        actionType: 'booking_reverted',
        actionId: booking.match.id,
        content: `Your booking for ${booking.listing.title} has been reverted back to a match by an administrator. Reason: ${reason}`,
        url: `/app/renter/matches`,
        unread: true,
        userId: booking.userId,
      }),
      createNotification({
        actionType: 'booking_reverted',
        actionId: booking.match.id,
        content: `The booking for ${booking.listing.title} by ${booking.user.firstName} ${booking.user.lastName} has been reverted back to a match by an administrator.`,
        url: `/app/host-dashboard/${booking.listing.id}?tab=matches`,
        unread: true,
        userId: booking.listing.user.id,
      })
    ]);

    console.log(`📬 Notifications sent for reverted booking ${bookingId}`);

    revalidatePath('/admin/booking-management');
    revalidatePath('/admin/booking-management/' + bookingId);

    return { success: true, message: 'Booking successfully reverted to match' };
  } catch (error) {
    console.error(`❌ Error reverting booking ${bookingId}:`, error);
    throw new Error(`Failed to revert booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function bulkCancelBookings(bookingIds: string[], reason: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const results = [];

  for (const bookingId of bookingIds) {
    try {
      const result = await cancelBooking(bookingId, reason);
      results.push({ bookingId, success: true, booking: result });
    } catch (error) {
      results.push({ 
        bookingId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  revalidatePath('/admin/booking-management');

  return results;
}
'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { Booking, ListingUnavailability, Prisma, Notification  } from '@prisma/client'
import { createNotification } from './notifications'

// Utility function to generate scheduled rent payments with pro-rating
function generateRentPayments(
  bookingId: string,
  monthlyRent: number,
  startDate: Date,
  endDate: Date,
  stripePaymentMethodId: string
): Prisma.RentPaymentCreateManyInput[] {
  const payments: Prisma.RentPaymentCreateManyInput[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Start from the first of the month after start date (or same month if starts on 1st)
  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
  
  // If booking starts after the 1st, add a pro-rated payment for the partial month
  if (start.getDate() > 1) {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const daysFromStart = daysInMonth - start.getDate() + 1;
    const proRatedAmount = Math.round((monthlyRent * daysFromStart) / daysInMonth);
    
    payments.push({
      bookingId,
      amount: proRatedAmount,
      dueDate: start,
      stripePaymentMethodId,
      paymentAuthorizedAt: new Date(),
    });
    
    // Move to next month for regular payments
    currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }
  
  // Generate monthly payments on the 1st of each month
  while (currentDate <= end) {
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Check if this is the last month and we need pro-rating
    if (monthEnd > end && end.getDate() < monthEnd.getDate()) {
      const daysInMonth = monthEnd.getDate();
      const daysToEnd = end.getDate();
      const proRatedAmount = Math.round((monthlyRent * daysToEnd) / daysInMonth);
      
      payments.push({
        bookingId,
        amount: proRatedAmount,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
      });
    } else {
      // Full month payment
      payments.push({
        bookingId,
        amount: monthlyRent,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
      });
    }
    
    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }
  
  return payments;
}

// Create a new booking
// update the type to be a partial of booking
export async function createBooking(data: Prisma.BookingCreateInput): Promise<Booking> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // First get the match to get the tripId and payment method
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

  if (!match.stripePaymentMethodId) {
    throw new Error('Payment method not found for this match');
  }

  if (!data.monthlyRent) {
    throw new Error('Monthly rent is required to generate payment schedule');
  }

  const booking = await prisma.booking.create({
    data: {
      ...data,
      userId,
      tripId: match.tripId, // Add the tripId from the match
    },
  });

  // Generate rent payments schedule
  const rentPayments = generateRentPayments(
    booking.id,
    data.monthlyRent as number,
    data.startDate as Date,
    data.endDate as Date,
    match.stripePaymentMethodId
  );

  // Create all rent payments
  if (rentPayments.length > 0) {
    await prisma.rentPayment.createMany({
      data: rentPayments
    });
  }

  const notificationData: Notification = {
    actionType: 'booking',
    actionId: booking.id,
    content: `You have a new booking for ${match?.listing.title} from ${match?.trip.startDate} to ${match?.trip.endDate}`,
    url: `/app/host-dashboard/${match?.listing.id}?tab=bookings`,
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

// Get all host listings with their matches (similar to how listing dashboard context works)
export async function getHostListingsWithMatches() {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('No userId found in auth for host listings');
      return [];
    }

    console.log('Fetching all host listings with matches for userId:', userId);

    const listings = await prisma.listing.findMany({
      where: { 
        userId: userId // Get listings owned by the current user
      },
      include: {
        matches: {
          include: {
            BoldSignLease: true,
            Lease: true,
            booking: true,
            trip: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    console.log('Found host listings:', listings.length);
    return listings;
  } catch (error) {
    console.error('Error in getHostListingsWithMatches:', error);
    return [];
  }
}

// Get host bookings and listings data for dashboard processing (mirrors listing page approach)
export async function getHostDashboardData() {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('No userId found in auth for dashboard data');
      return { bookings: [], listings: [] };
    }

    console.log('Fetching dashboard data for userId:', userId);

    // Fetch both bookings and listings with matches in parallel
    const [bookings, listings] = await Promise.all([
      getHostBookings(),
      getHostListingsWithMatches()
    ]);

    console.log('Dashboard data fetched - bookings:', bookings.length, 'listings:', listings.length);
    
    return { bookings, listings };
  } catch (error) {
    console.error('Error in getHostDashboardData:', error);
    return { bookings: [], listings: [] };
  }
}

// Create booking from completed match (for webhooks - no auth required)
export async function createBookingFromCompletedMatch(matchId: string) {
  try {
    console.log('Creating booking from completed match:', matchId);
    
    // Get the match with all required data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: true,
        listing: true,
        booking: true
      }
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Check if booking already exists
    if (match.booking) {
      console.log('Booking already exists for match:', matchId);
      return { success: true, booking: match.booking };
    }

    // Verify payment is authorized
    if (!match.paymentAuthorizedAt) {
      throw new Error('Payment not authorized for this match');
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: match.trip.userId,
        listingId: match.listingId,
        tripId: match.tripId,
        matchId: match.id,
        startDate: match.trip.startDate!,
        endDate: match.trip.endDate!,
        monthlyRent: match.monthlyRent,
        status: 'confirmed'
      }
    });

    console.log('✅ Booking created:', booking.id);

    // Generate rent payments schedule if we have payment method
    if (match.stripePaymentMethodId && match.monthlyRent) {
      const rentPayments = generateRentPayments(
        booking.id,
        match.monthlyRent,
        match.trip.startDate!,
        match.trip.endDate!,
        match.stripePaymentMethodId
      );

      if (rentPayments.length > 0) {
        await prisma.rentPayment.createMany({
          data: rentPayments
        });
        console.log(`✅ Created ${rentPayments.length} rent payments for booking:`, booking.id);
      }
    }

    // Create notification for the host
    await createNotification({
      actionType: 'booking',
      actionId: booking.id,
      content: `You have a new booking for ${match.listing.title} from ${new Date(match.trip.startDate!).toLocaleDateString()} to ${new Date(match.trip.endDate!).toLocaleDateString()}`,
      url: `/app/host-dashboard/${match.listing.id}?tab=bookings`,
      unread: true,
      userId: match.listing.userId,
    });

    console.log('✅ Host booking notification sent');

    return { success: true, booking };
  } catch (error) {
    console.error('❌ Error creating booking from completed match:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
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

    // First, ensure any completed matches have bookings created
    await createBookingsForCompletedMatches();

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

// Mark move-in as complete and trigger first month rent pre-authorization
export async function markMoveInComplete(bookingId: string) {
  try {
    const { userId, sessionClaims } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const userRole = sessionClaims?.metadata.role;
    if (userRole !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    // Get booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        listing: true,
        match: {
          include: {
            trip: true
          }
        },
        rentPayments: {
          orderBy: { dueDate: 'asc' },
          take: 1
        }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update booking status to mark move-in complete
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        moveInCompletedAt: new Date(),
        status: 'active'
      }
    });

    // Get the first rent payment
    const firstRentPayment = booking.rentPayments[0];
    if (!firstRentPayment) {
      throw new Error('No rent payment found for this booking');
    }

    // Create notification for renter to authorize payment
    await createNotification({
      actionType: 'payment_authorization_required',
      actionId: firstRentPayment.id,
      content: `Your move-in has been confirmed! Please authorize your first month's rent payment of $${firstRentPayment.amount}.`,
      url: `/app/renter/bookings/${bookingId}/authorize-payment`,
      unread: true,
      userId: booking.userId,
    });

    // Send email notification to renter (you can implement this based on your email service)
    // await sendPaymentAuthorizationEmail(booking.user.email, booking, firstRentPayment);

    revalidatePath(`/app/host/${booking.listingId}/bookings`);
    revalidatePath('/app/host/host-dashboard');

    return { success: true, message: 'Move-in marked as complete and payment authorization request sent' };
  } catch (error) {
    console.error('Error marking move-in complete:', error);
    throw error;
  }
}

// Get all host bookings including matches ready to be converted to bookings
export async function getAllHostBookings() {
  try {
    const { userId } = auth();
    console.log('🔍 getAllHostBookings - Auth userId:', userId);
    console.log('🔍 getAllHostBookings - Auth userId type:', typeof userId);
    
    if (!userId) {
      console.log('❌ No userId found in auth for getAllHostBookings');
      return { bookings: [], readyMatches: [] };
    }

    console.log('✅ Fetching all host bookings and ready matches for userId:', userId);
    
    // Debug: Check if this user actually has any listings
    const userListingCount = await prisma.listing.count({
      where: { userId: userId }
    });
    console.log('📊 User has', userListingCount, 'listings');
    
    // Debug: Check if there are any bookings for this user's listings
    const userBookingCount = await prisma.booking.count({
      where: { 
        listing: {
          userId: userId
        }
      }
    });
    console.log('📊 User has', userBookingCount, 'bookings for their listings');

    // Get existing bookings
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
        }
      }
    });

    // Get matches ready to be converted to bookings (tenant signed, payment authorized, but landlord hasn't signed yet)
    const readyMatches = await prisma.match.findMany({
      where: {
        AND: [
          { paymentAuthorizedAt: { not: null } }, // Payment is authorized
          { booking: null }, // No booking exists yet
          {
            BoldSignLease: {
              tenantSigned: true // Tenant has signed
            }
          },
          {
            listing: {
              userId: userId // Only matches for listings owned by this host
            }
          }
        ]
      },
      orderBy: { paymentAuthorizedAt: 'desc' },
      include: {
        trip: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
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
        BoldSignLease: true,
        Lease: true
      }
    });

    console.log('📊 FINAL RESULTS - Found bookings:', bookings.length, 'ready matches:', readyMatches.length);
    console.log('🔍 Booking IDs found:', bookings.map(b => b.id));
    console.log('🔍 Ready match IDs found:', readyMatches.map(m => m.id));
    
    return { bookings, readyMatches };
  } catch (error) {
    console.error('Error in getAllHostBookings:', error);
    return { bookings: [], readyMatches: [] };
  }
}

// Get all bookings for a specific listing including matches ready to be converted to bookings
export async function getAllListingBookings(listingId: string) {
  try {
    const { userId } = auth();
    console.log('🔍 getAllListingBookings - Auth userId:', userId, 'listingId:', listingId);
    
    if (!userId) {
      console.log('❌ No userId found in auth for getAllListingBookings');
      return { bookings: [], readyMatches: [] };
    }

    // First verify the listing belongs to the current user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing || listing.userId !== userId) {
      console.log('❌ Unauthorized to view bookings for this listing');
      return { bookings: [], readyMatches: [] };
    }

    console.log('✅ Fetching listing bookings and ready matches for listingId:', listingId);
    
    // Get existing bookings for this specific listing
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
        }
      }
    });

    // Get matches ready to be converted to bookings for this specific listing
    const readyMatches = await prisma.match.findMany({
      where: {
        AND: [
          { listingId: listingId }, // Only matches for this specific listing
          { paymentAuthorizedAt: { not: null } }, // Payment is authorized
          { booking: null }, // No booking exists yet
          {
            BoldSignLease: {
              tenantSigned: true // Tenant has signed
            }
          }
        ]
      },
      orderBy: { paymentAuthorizedAt: 'desc' },
      include: {
        trip: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
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
        BoldSignLease: true,
        Lease: true
      }
    });

    console.log('📊 FINAL RESULTS - Found bookings:', bookings.length, 'ready matches:', readyMatches.length);
    console.log('🔍 Booking IDs found:', bookings.map(b => b.id));
    console.log('🔍 Ready match IDs found:', readyMatches.map(m => m.id));
    
    return { bookings, readyMatches };
  } catch (error) {
    console.error('Error in getAllListingBookings:', error);
    return { bookings: [], readyMatches: [] };
  }
}

// Utility function to check for completed matches and create bookings
export async function createBookingsForCompletedMatches() {
  try {
    // Find matches that are fully completed but don't have bookings yet
    const completedMatches = await prisma.match.findMany({
      where: {
        AND: [
          { paymentAuthorizedAt: { not: null } }, // Payment is authorized
          { booking: null }, // No booking exists yet
          {
            BoldSignLease: {
              landlordSigned: true,
              tenantSigned: true
            }
          }
        ]
      },
      include: {
        trip: true,
        listing: true,
        BoldSignLease: true
      }
    });

    console.log(`Found ${completedMatches.length} completed matches without bookings`);

    for (const match of completedMatches) {
      try {
        const booking = await prisma.booking.create({
          data: {
            userId: match.trip.userId,
            listingId: match.listingId,
            tripId: match.tripId,
            matchId: match.id,
            startDate: match.trip.startDate!,
            endDate: match.trip.endDate!,
            monthlyRent: match.monthlyRent,
            status: 'confirmed'
          }
        });

        console.log(`✅ Created booking ${booking.id} for completed match ${match.id}`);
      } catch (error) {
        console.error(`❌ Failed to create booking for match ${match.id}:`, error);
      }
    }

    return completedMatches.length;
  } catch (error) {
    console.error('Error creating bookings for completed matches:', error);
    return 0;
  }
}


'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { Booking, ListingUnavailability, Prisma, Notification  } from '@prisma/client'
import { createNotification } from './notifications'
import { generateRentPayments } from '@/lib/utils/rent-payments'

export async function getBookingWithModifications(bookingId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: { 
          select: { 
            title: true, 
            userId: true 
          } 
        },
        user: { 
          select: { 
            id: true 
          } 
        },
        rentPayments: {
          select: {
            id: true,
            paymentModifications: {
              select: {
                id: true,
                requestorId: true,
                recipientId: true,
                originalAmount: true,
                originalDueDate: true,
                newAmount: true,
                newDueDate: true,
                reason: true,
                status: true,
                requestedAt: true,
                viewedAt: true,
                approvedAt: true,
                rejectedAt: true,
                rejectionReason: true,
                createdAt: true,
                requestor: {
                  select: {
                    fullName: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true
                  }
                },
                recipient: {
                  select: {
                    fullName: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        bookingModifications: {
          select: {
            id: true,
            requestorId: true,
            recipientId: true,
            originalStartDate: true,
            originalEndDate: true,
            newStartDate: true,
            newEndDate: true,
            reason: true,
            status: true,
            requestedAt: true,
            viewedAt: true,
            approvedAt: true,
            rejectedAt: true,
            rejectionReason: true,
            requestor: {
              select: {
                fullName: true,
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            },
            recipient: {
              select: {
                fullName: true,
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Verify user has permission to view this booking
    const isHost = booking.listing?.userId === userId
    const isRenter = booking.user?.id === userId
    
    if (!isHost && !isRenter) {
      return { success: false, error: 'Unauthorized to view this booking' }
    }

    return { success: true, booking }
  } catch (error) {
    console.error('Error fetching booking with modifications:', error)
    return { success: false, error: 'Failed to fetch booking' }
  }
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

  console.log('📚 getUserBookings: Fetching bookings for userId:', userId);

  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        select: {
          title: true,
          imageSrc: true,
          userId: true,
          locationString: true
        }
      },
      trip: {
        select: {
          numAdults: true,
          numPets: true,
          numChildren: true
        }
      },
      rentPayments: {
        orderBy: { amount: 'desc' },
        include: {
          paymentModifications: {
            select: {
              id: true,
              requestorId: true,
              recipientId: true,
              originalAmount: true,
              originalDueDate: true,
              newAmount: true,
              newDueDate: true,
              reason: true,
              status: true,
              requestedAt: true,
              viewedAt: true,
              approvedAt: true,
              rejectedAt: true,
              rejectionReason: true,
              createdAt: true,
              requestor: {
                select: {
                  fullName: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true
                }
              },
              recipient: {
                select: {
                  fullName: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      },
      bookingModifications: {
        select: {
          id: true,
          requestorId: true,
          recipientId: true,
          originalStartDate: true,
          originalEndDate: true,
          newStartDate: true,
          newEndDate: true,
          reason: true,
          status: true,
          requestedAt: true,
          viewedAt: true,
          approvedAt: true,
          rejectedAt: true,
          rejectionReason: true,
          createdAt: true,
          requestor: {
            select: {
              fullName: true,
              firstName: true,
              lastName: true,
              imageUrl: true
            }
          },
          recipient: {
            select: {
              fullName: true,
              firstName: true,
              lastName: true,
              imageUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  console.log('📚 getUserBookings: Found', bookings.length, 'bookings');

  return bookings;
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

// Delete a booking (dev/admin only)
// NOTE: When a booking is deleted, the associated Match.booking relationship is automatically
// nulled by Prisma's relation system (relationMode = "prisma"). However, we explicitly handle
// this below for clarity and to ensure proper logging and validation.
export async function deleteBooking(id: string): Promise<void> {
  const { userId, sessionClaims } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Check if user is admin OR in development environment
  const userRole = sessionClaims?.metadata?.role;
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment && userRole !== 'admin') {
    throw new Error('Unauthorized - Admin access required or development environment');
  }

  console.log(`🗑️ Starting deletion process for booking: ${id}`);

  // First, validate the booking exists and get the associated match
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      match: {
        select: {
          id: true,
          listingId: true,
          tripId: true
        }
      }
    }
  });

  if (!booking) {
    throw new Error(`Booking ${id} not found`);
  }

  if (!booking.match) {
    console.warn(`⚠️ Warning: Booking ${id} has no associated match. This is unusual but proceeding with deletion.`);
  } else {
    console.log(`📊 Found associated match ${booking.match.id} for booking ${id}`);
    console.log(`   Match details: listingId=${booking.match.listingId}, tripId=${booking.match.tripId}`);
  }

  // Delete in transaction to handle related records in correct order
  await prisma.$transaction(async (tx) => {
    // First get all rent payment IDs for this booking
    const rentPayments = await tx.rentPayment.findMany({
      where: { bookingId: id },
      select: { id: true }
    });

    console.log(`📋 Found ${rentPayments.length} rent payment(s) to delete`);

    // Delete PaymentModifications first (they have FK to RentPayment)
    if (rentPayments.length > 0) {
      const deletedPaymentMods = await tx.paymentModification.deleteMany({
        where: {
          rentPaymentId: {
            in: rentPayments.map(rp => rp.id)
          }
        }
      });
      console.log(`🗑️ Deleted ${deletedPaymentMods.count} payment modification(s)`);
    }

    // Delete BookingModifications (they have FK to Booking)
    const deletedBookingMods = await tx.bookingModification.deleteMany({
      where: { bookingId: id }
    });
    console.log(`🗑️ Deleted ${deletedBookingMods.count} booking modification(s)`);

    // Delete Reviews related to this booking
    const deletedReviews = await tx.review.deleteMany({
      where: { bookingId: id }
    });
    console.log(`🗑️ Deleted ${deletedReviews.count} review(s)`);

    // Then delete all related RentPayment records
    const deletedRentPayments = await tx.rentPayment.deleteMany({
      where: { bookingId: id }
    });
    console.log(`🗑️ Deleted ${deletedRentPayments.count} rent payment(s)`);

    // Explicitly log the Match state before deletion
    // Note: The Match.booking relation will be automatically nulled when the booking is deleted
    // due to Prisma's relationMode = "prisma" which emulates foreign key constraints
    if (booking.match) {
      console.log(`🔗 Match ${booking.match.id} will have its booking reference nulled`);
      console.log(`   Match will remain in database but booking field will be null`);
    }

    // Finally delete the booking
    // This will automatically null the Match.booking relation
    await tx.booking.delete({
      where: { id, userId },
    });
    console.log(`✅ Successfully deleted booking ${id}`);
  });

  // Verify the match state after deletion
  if (booking.match) {
    const updatedMatch = await prisma.match.findUnique({
      where: { id: booking.match.id },
      include: { booking: true }
    });

    if (updatedMatch) {
      console.log(`✅ Verified: Match ${updatedMatch.id} now has booking = ${updatedMatch.booking ? 'NOT NULL (ERROR!)' : 'null (correct)'}`);
      if (updatedMatch.booking) {
        console.error(`❌ ERROR: Match ${updatedMatch.id} still has a booking reference after deletion!`);
      }
    } else {
      console.warn(`⚠️ Warning: Match ${booking.match.id} was not found after booking deletion`);
    }
  }

  revalidatePath('/app/rent/bookings');
  console.log(`🏁 Booking deletion complete for ${id}`);
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
        rentPayments: {
          select: {
            id: true,
            amount: true,
            type: true,
            dueDate: true,
            isPaid: true,
            paymentModifications: {
              select: {
                id: true,
                requestorId: true,
                recipientId: true,
                originalAmount: true,
                originalDueDate: true,
                newAmount: true,
                newDueDate: true,
                reason: true,
                status: true,
                requestedAt: true,
                viewedAt: true,
                approvedAt: true,
                rejectedAt: true,
                rejectionReason: true,
                createdAt: true,
                requestor: {
                  select: {
                    fullName: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true
                  }
                },
                recipient: {
                  select: {
                    fullName: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        bookingModifications: {
          select: {
            id: true,
            requestorId: true,
            recipientId: true,
            originalStartDate: true,
            originalEndDate: true,
            newStartDate: true,
            newEndDate: true,
            reason: true,
            status: true,
            requestedAt: true,
            viewedAt: true,
            approvedAt: true,
            rejectedAt: true,
            rejectionReason: true,
            createdAt: true,
            requestor: {
              select: {
                fullName: true,
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            },
            recipient: {
              select: {
                fullName: true,
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('🏠 getHostBookings: Found', bookings.length, 'bookings');
    
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
        },
        rentPayments: {
          select: {
            id: true,
            amount: true,
            type: true,
            dueDate: true,
            isPaid: true,
            paymentModifications: {
              select: {
                id: true,
                requestorId: true,
                recipientId: true,
                originalAmount: true,
                originalDueDate: true,
                newAmount: true,
                newDueDate: true,
                reason: true,
                status: true,
                requestedAt: true,
                viewedAt: true,
                approvedAt: true,
                rejectedAt: true,
                rejectionReason: true,
                createdAt: true,
                requestor: {
                  select: {
                    fullName: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true
                  }
                },
                recipient: {
                  select: {
                    fullName: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        bookingModifications: {
          select: {
            id: true,
            requestorId: true,
            recipientId: true,
            originalStartDate: true,
            originalEndDate: true,
            newStartDate: true,
            newEndDate: true,
            reason: true,
            status: true,
            requestedAt: true,
            viewedAt: true,
            approvedAt: true,
            rejectedAt: true,
            rejectionReason: true,
            createdAt: true,
            requestor: {
              select: {
                fullName: true,
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            },
            recipient: {
              select: {
                fullName: true,
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('🏢 getBookingsByListingId: Found', bookings.length, 'bookings for listing', listingId);

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
        },
        rentPayments: {
          select: {
            id: true,
            amount: true,
            dueDate: true,
            isPaid: true
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
        },
        rentPayments: {
          select: {
            id: true,
            amount: true,
            type: true,
            dueDate: true,
            isPaid: true,
            paymentModifications: {
              select: {
                id: true,
                requestorId: true,
                recipientId: true,
                originalAmount: true,
                originalDueDate: true,
                newAmount: true,
                newDueDate: true,
                reason: true,
                status: true,
                requestedAt: true,
                viewedAt: true,
                approvedAt: true,
                rejectedAt: true,
                rejectionReason: true,
                createdAt: true,
                requestor: {
                  select: {
                    fullName: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true
                  }
                },
                recipient: {
                  select: {
                    fullName: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        },
        bookingModifications: {
          select: {
            id: true,
            requestorId: true,
            recipientId: true,
            originalStartDate: true,
            originalEndDate: true,
            newStartDate: true,
            newEndDate: true,
            reason: true,
            status: true,
            requestedAt: true,
            viewedAt: true,
            approvedAt: true,
            rejectedAt: true,
            rejectionReason: true,
            createdAt: true,
            requestor: {
              select: {
                fullName: true,
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            },
            recipient: {
              select: {
                fullName: true,
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            }
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


'use server'

import prismadb from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { HousingRequest, Notification } from '@prisma/client'
import { TripAndMatches, ListingAndImages } from '@/types/'
import { auth } from '@clerk/nextjs/server'
import { calculateRent } from '@/lib/calculate-rent'
import { findConversationBetweenUsers, createListingConversation } from './conversations'
import { sendNotificationEmail } from '@/lib/send-notification-email'
import { buildNotificationEmailData as buildEmailConfig, getNotificationEmailSubject } from '@/lib/notification-email-config'
import { buildNotificationEmailData } from '@/lib/notification-builders'
import { MAX_APPLICATIONS_PER_TRIP, MAX_APPLICATIONS_TOTAL } from '@/constants/search-constants'

type CreateNotificationInput = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;


export async function getHousingRequestById(housingRequestId: string) {
  try {
    const housingRequest = await prismadb.housingRequest.findUnique({
      where: {
        id: housingRequestId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            signingInitials: true, // Add signing initials field
            applications: {
              select: {
                id: true,
                verificationImages: true,
                incomes: true,
                identifications: {
                  select: {
                    id: true,
                    idPhotos: true,
                  }
                },
                residentialHistories: true,
              }
            }
          }
        },
        listing: {
          include: {
            monthlyPricing: true,
            listingImages: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
                signingInitials: true // Add signing initials for host user too
              }
            }
          }
        },
        boldSignLease: true,
        trip: {
          include: {
            allParticipants: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                signingInitials: true
              }
            }
          }
        }
      },
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    // Check if there's a booking for this housing request (via match)
    let hasBooking = false;
    if (housingRequest.status === 'approved') {
      const match = await prismadb.match.findFirst({
        where: {
          tripId: housingRequest.tripId,
          listingId: housingRequest.listingId
        },
        include: {
          booking: true
        }
      });
      hasBooking = !!match?.booking;
    }

    // Calculate monthly rent for this housing request
    const monthlyRent = calculateRent({ 
      listing: housingRequest.listing, 
      trip: housingRequest.trip 
    });

    return { ...housingRequest, hasBooking, monthlyRent };
  } catch (error) {
    console.error('Error fetching housing request:', error);
    throw new Error('Failed to fetch housing request');
  }
}

export async function getHousingRequestsByListingId(listingId: string) {
  try {
    // Use a single query with proper joins to avoid N+1 problem
    const housingRequests = await prismadb.housingRequest.findMany({
      where: {
        listingId: listingId,
      },
      include: {
        user: {
          include: {
            applications: {
              include: {
                verificationImages: true,
                incomes: true,
                identifications: true,
              }
            }
          }
        },
        trip: true // Include trip data directly in the join
      },
    });

    return housingRequests;
  } catch (error) {
    console.error('Error fetching housing requests:', error);
    throw new Error('Failed to fetch housing requests');
  }
}

export const createDbHousingRequest = async (trip: TripAndMatches, listing: ListingAndImages): Promise<HousingRequest> => {
  // NEED TO ENFORCE DATE ADDITION AT APPLICATION LEVEL
  if (!trip.startDate || !trip.endDate) {
    throw new Error(`Need start and end date (both)`);
  }

  // Prevent users from applying to their own listings
  if (trip.userId === listing.userId) {
    throw new Error('You cannot apply to your own listing');
  }

  try {
    const newHousingRequest = await prismadb.housingRequest.create({
      data: {
        userId: trip.userId,
        listingId: listing.id,
        tripId: trip.id,
        startDate: trip.startDate,
        endDate: trip.endDate,
      },
    });

    // Get host information for the renter's email
    const host = await prismadb.user.findUnique({
      where: { id: listing.userId },
      select: { firstName: true }
    });
    const hostFirstName = host?.firstName || 'the host';

    // Get requester info for email
    const requester = await prismadb.user.findUnique({
      where: {
        id: trip.userId
      },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    });

    // Send email-only notification to renter (no platform notification)
    if (requester?.email) {
      const emailData = buildEmailConfig(
        'application_submitted',
        {
          content: `Your application for ${listing.title} has been submitted.`,
          url: `/app/rent/applications/${newHousingRequest.id}`
        },
        requester,
        {
          renterName: requester.firstName || 'there',
          listingTitle: listing.title,
          hostFirstName: hostFirstName
        }
      );

      const subject = getNotificationEmailSubject('application_submitted', {
        listingTitle: listing.title,
        hostFirstName: hostFirstName
      });

      await sendNotificationEmail({
        to: requester.email,
        subject,
        emailData
      });
    }

    let requesterName = ''

    requester?.firstName && (requesterName += requester.firstName + ' ');
    requester?.lastName && (requesterName += requester.lastName);
    !requesterName && (requesterName += requester?.email)
    if (requesterName.length > 28) {
      requesterName = requesterName.slice(0, 25) + '...'
    }


    const messageContent = `${requesterName.trim()} wants to stay at your property ${listing.title}`;

    // Format date range for notification
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(date));
    };
    const dateRange = `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`;

    const notificationData: CreateNotificationInput = {
      userId: listing.userId,
      content: `New application to ${listing.title} for ${dateRange}`,
      url: `/app/host/${listing.id}/applications`,
      actionType: 'view',
      actionId: newHousingRequest.id,
      emailData: {
        renterName: requesterName.trim(),
        listingTitle: listing.title,
        dateRange: dateRange
      }
    } as CreateNotificationInput;
    createNotification(notificationData)

    return newHousingRequest;
  } catch (error) {
    console.error('Error creating housing request:', error);
    throw new Error('Failed to create housing request');
  }

};

export const deleteDbHousingRequest = async (tripId: string, listingId: string) => {
  console.log(`Deleting HousingRequest with trip ${tripId} and listing ${listingId}`);
  try {
    // Delete the favorite
    const deletedRequest = await prismadb.housingRequest.delete({
      where: {
        listingId_tripId: {
          tripId,
          listingId
        }
      }
    });

    try {
      await prismadb.notification.deleteMany({
        where: {
          AND: [
            { actionType: 'view' },
            { actionId: deletedRequest.id }
          ]
        }
      });
    } catch (error) {
      // Ignore error if notification doesn't exist
      if (!(error instanceof Error) || !error.message.includes('Record to delete does not exist')) {
        throw error;
      }
    }


    // Revalidate the favorites page or any other relevant pages
    revalidatePath('/housingRequests');

    return deletedRequest;
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw error;
  }
}

// Check if user has reached application limits
export async function checkApplicationLimits(tripId: string, userId: string) {
  try {
    console.log('🔍 checkApplicationLimits called with:', { tripId, userId });

    // Check if user has completed their application for this trip
    let application = await prismadb.application.findUnique({
      where: {
        userId_tripId: {
          userId: userId,
          tripId: tripId
        }
      },
      select: {
        id: true,
        isComplete: true,
        tripId: true
      }
    });

    console.log('📋 Trip-specific application found:', application);

    // If no trip-specific application, check for default application
    if (!application) {
      console.log('🔍 No trip-specific application, checking for default application...');
      application = await prismadb.application.findFirst({
        where: {
          userId: userId,
          isDefault: true
        },
        select: {
          id: true,
          isComplete: true,
          tripId: true
        }
      });
      console.log('📋 Default application found:', application);
    }

    if (application) {
      console.log('📋 Application ID:', application.id);
      console.log('📋 Application.tripId:', application.tripId);
      console.log('📋 Application.isComplete field value:', application.isComplete);
      console.log('📋 Type of isComplete:', typeof application.isComplete);
    } else {
      console.log('❌ No application found (neither trip-specific nor default)');
    }

    if (!application?.isComplete) {
      console.log('❌ Application check failed - application is incomplete or not found');
      return {
        canApply: false,
        reason: "Please complete your application before applying to listings",
        tripCount: 0,
        totalCount: 0
      };
    }

    console.log('✅ Application is complete, proceeding with limit checks');

    // Count open applications for this specific trip (excluding those with matches)
    const tripApplications = await prismadb.housingRequest.findMany({
      where: {
        tripId: tripId,
        trip: {
          userId: userId
        }
      },
      select: {
        id: true,
        tripId: true,
        listingId: true
      }
    });

    console.log('📊 Found', tripApplications.length, 'total housing requests for this trip');

    // Check which applications have matches
    let tripOpenCount = 0;
    for (const app of tripApplications) {
      const hasMatch = await checkIfRequestHasMatch(app.tripId, app.listingId);
      console.log(`  - Housing request ${app.id.substring(0, 8)}... hasMatch:`, hasMatch);
      if (!hasMatch) {
        tripOpenCount++;
      }
    }

    console.log('📊 Trip open count (without matches):', tripOpenCount, '/', MAX_APPLICATIONS_PER_TRIP);

    // Count total open applications across all trips
    const allApplications = await prismadb.housingRequest.findMany({
      where: {
        trip: {
          userId: userId
        }
      },
      select: {
        id: true,
        tripId: true,
        listingId: true
      }
    });

    console.log('📊 Found', allApplications.length, 'total housing requests across ALL trips');

    let totalOpenCount = 0;
    for (const app of allApplications) {
      const hasMatch = await checkIfRequestHasMatch(app.tripId, app.listingId);
      if (!hasMatch) {
        totalOpenCount++;
      }
    }

    console.log('📊 Total open count across all trips (without matches):', totalOpenCount, '/', MAX_APPLICATIONS_TOTAL);

    // Check limits
    if (tripOpenCount >= MAX_APPLICATIONS_PER_TRIP) {
      console.log('❌ LIMIT EXCEEDED: Trip limit reached', tripOpenCount, '>=', MAX_APPLICATIONS_PER_TRIP);
      return {
        canApply: false,
        reason: `You've reached the maximum of ${MAX_APPLICATIONS_PER_TRIP} open applications for this trip`,
        tripCount: tripOpenCount,
        totalCount: totalOpenCount
      };
    }

    if (totalOpenCount >= MAX_APPLICATIONS_TOTAL) {
      console.log('❌ LIMIT EXCEEDED: Total limit reached', totalOpenCount, '>=', MAX_APPLICATIONS_TOTAL);
      return {
        canApply: false,
        reason: `You've reached the maximum of ${MAX_APPLICATIONS_TOTAL} total open applications across all trips`,
        tripCount: tripOpenCount,
        totalCount: totalOpenCount
      };
    }

    console.log('✅ All limits passed! User can apply.');
    return {
      canApply: true,
      tripCount: tripOpenCount,
      totalCount: totalOpenCount
    };
  } catch (error) {
    console.error('Error checking application limits:', error);
    throw error;
  }
}

export async function optimisticApplyDb(tripId: string, listing: ListingAndImages) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error('Unauthorized');

    const trip = await prismadb.trip.findUnique({
      where: { id: tripId },
      include: {
        favorites: true,
        dislikes: true,
        housingRequests: true,
        matches: true,
      }
    });

    if (!trip) throw new Error('Trip not found');

    // Prevent users from applying to their own listings
    if (trip.userId === listing.userId) {
      throw new Error('You cannot apply to your own listing');
    }

    // Check application limits
    const limitsCheck = await checkApplicationLimits(tripId, userId);
    if (!limitsCheck.canApply) {
      return {
        success: false,
        error: 'LIMIT_EXCEEDED',
        message: limitsCheck.reason
      };
    }

    const housingRequest = await createDbHousingRequest(trip, listing);

    return { success: true, housingRequest };
  } catch (error) {
    console.error('Failed to apply:', error);
    return { success: false };
  }
}

export async function optimisticRemoveApplyDb(tripId: string, listingId: string) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error('Unauthorized');

    await deleteDbHousingRequest(tripId, listingId);

    return { success: true };
  } catch (error) {
    console.error('Failed to remove application:', error);
    return { success: false };
  }
}

// Get housing request statistics for the current user
export async function getUserHousingRequestStats() {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const totalRequests = await getTotalUserHousingRequests(userId);
    const openRequests = await getOpenUserHousingRequests(userId);

    return {
      open: openRequests,
      total: totalRequests
    };
  } catch (error) {
    console.error('Error fetching user housing request stats:', error);
    throw new Error('Failed to fetch housing request stats');
  }
}

const getTotalUserHousingRequests = async (userId: string) => {
  return await prismadb.housingRequest.count({
    where: {
      trip: {
        userId: userId
      }
    }
  });
};

const getOpenUserHousingRequests = async (userId: string) => {
  const housingRequestsWithoutMatches = await prismadb.housingRequest.findMany({
    where: {
      trip: {
        userId: userId
      }
    },
    include: {
      trip: true,
      listing: true
    }
  });

  const openRequestsCount = await countRequestsWithoutMatches(housingRequestsWithoutMatches);
  return openRequestsCount;
};

const countRequestsWithoutMatches = async (housingRequests: any[]) => {
  let openCount = 0;
  
  for (const request of housingRequests) {
    const hasMatch = await checkIfRequestHasMatch(request.tripId, request.listingId);
    if (!hasMatch) {
      openCount++;
    }
  }
  
  return openCount;
};

const checkIfRequestHasMatch = async (tripId: string, listingId: string) => {
  const match = await prismadb.match.findFirst({
    where: {
      tripId: tripId,
      listingId: listingId
    }
  });
  
  return !!match;
};

// Get all housing requests for the current user (renter perspective)
export async function getUserHousingRequests() {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const housingRequests = await prismadb.housingRequest.findMany({
      where: {
        trip: {
          userId: userId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            listingImages: true,
            monthlyPricing: true,
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
          include: {
            bookings: true // Include bookings to check if trip has any bookings
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true
          }
        }
      }
    });

    // Add match and booking information to each housing request
    const requestsWithMatchAndBookingInfo = await Promise.all(
      housingRequests.map(async (request) => {
        const hasMatch = await checkIfRequestHasMatch(request.tripId, request.listingId);
        const match = hasMatch ? await prismadb.match.findFirst({
          where: {
            tripId: request.tripId,
            listingId: request.listingId
          },
          include: {
            booking: true
          }
        }) : null;

        // Check if the trip has any bookings (more direct approach)
        const tripHasBooking = checkIfTripHasBooking(request.trip);

        return {
          ...request,
          hasMatch,
          match,
          hasBooking: tripHasBooking,
          tripBookings: request.trip.bookings,
          // Get the first booking ID for direct navigation
          bookingId: tripHasBooking ? request.trip.bookings[0].id : null
        };
      })
    );

    return requestsWithMatchAndBookingInfo;
  } catch (error) {
    console.error('Error fetching user housing requests:', error);
    throw new Error('Failed to fetch housing requests');
  }
};

// Check if a trip has any associated bookings
const checkIfTripHasBooking = (trip: any) => {
  return trip.bookings && trip.bookings.length > 0;
};

// Get or create conversation between current user and listing host
export async function getOrCreateListingConversation(listingId: string, hostUserId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First try to find existing conversation
    const existing = await findConversationBetweenUsers(listingId, hostUserId);
    if (existing.conversationId) {
      return { success: true, conversationId: existing.conversationId };
    }

    // If no conversation exists, create one
    const result = await createListingConversation(listingId, hostUserId);
    return result;
  } catch (error) {
    console.error('Error getting or creating listing conversation:', error);
    return { success: false, error: 'Failed to create conversation' };
  }
};

// Get all housing requests for the current host's listings
export async function getHostHousingRequests() {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('No userId found in auth');
      return []; // Return empty array instead of throwing error
    }

    console.log('Fetching housing requests for userId:', userId);

    // Use a single query with proper joins to avoid N+1 problem
    const housingRequests = await prismadb.housingRequest.findMany({
      where: {
        listing: {
          userId: userId // Get housing requests where the listing belongs to the current user (host)
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true
          }
        },
        listing: {
          select: {
            title: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true,
            monthlyPricing: true
          }
        },
        trip: {
          select: {
            numAdults: true,
            numPets: true,
            numChildren: true,
            minPrice: true,
            maxPrice: true
          }
        }
      }
    });

    console.log('Found housing requests:', housingRequests.length);
    return housingRequests;
  } catch (error) {
    console.error('Error in getHostHousingRequests:', error);
    // Return empty array instead of throwing error to prevent page crash
    return [];
  }
}

// Approve a housing request
export async function approveHousingRequest(housingRequestId: string) {
  try {
    console.log('🏠 approveHousingRequest called with ID:', housingRequestId);
    
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    console.log('👤 User ID:', userId);

    // First verify that the housing request belongs to a listing owned by the current user
    console.log('🔍 Looking up housing request:', housingRequestId);
    const housingRequest = await prismadb.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        user: true,
        trip: true
      }
    });

    console.log('📋 Housing request found:', {
      id: housingRequest?.id,
      status: housingRequest?.status,
      listingUserId: housingRequest?.listing?.userId,
      currentUserId: userId,
      authorized: housingRequest?.listing?.userId === userId
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only approve requests for your own listings');
    }

    // Start a transaction to ensure both operations succeed or fail together
    console.log('💾 Starting transaction to approve housing request and create match');
    const result = await prismadb.$transaction(async (tx) => {
      // Update the housing request status to approved
      console.log('🔄 Updating housing request status to approved:', housingRequestId);
      const updatedRequest = await tx.housingRequest.update({
        where: { id: housingRequestId },
        data: { status: 'approved' }
      });
      console.log('✅ Housing request status updated:', updatedRequest.status);

      // Create a match for this approved housing request
      const monthlyRent = calculateRent({ 
        listing: housingRequest.listing, 
        trip: housingRequest.trip 
      });

      console.log('🔄 Creating match with data:', {
        tripId: housingRequest.tripId,
        listingId: housingRequest.listingId,
        monthlyRent,
        leaseDocumentId: housingRequest.leaseDocumentId
      });

      // Ensure leaseDocumentId exists on housing request
      if (!housingRequest.leaseDocumentId) {
        console.warn('⚠️ Housing request does not have leaseDocumentId - match will be created without document link');
      }

      const match = await tx.match.create({
        data: {
          tripId: housingRequest.tripId,
          listingId: housingRequest.listingId,
          monthlyRent: monthlyRent,
          leaseDocumentId: housingRequest.leaseDocumentId, // Copy from housing request
        },
      });

      console.log('✅ Match created:', {
        id: match.id,
        leaseDocumentId: match.leaseDocumentId,
        monthlyRent: match.monthlyRent
      });

      return { updatedRequest, match };
    });

    // Get host name for notification
    const host = await prismadb.user.findUnique({
      where: { id: housingRequest.listing.userId },
      select: { firstName: true, lastName: true }
    });
    const hostName = host?.firstName || 'the host';

    // Create a notification for the applicant
    console.log('📧 Creating notification for applicant');
    const notificationData = {
      userId: housingRequest.userId,
      content: `You have a Match!`,
      url: `/app/rent/match/${result.match.id}/lease-signing`,
      actionType: 'application_approved',
      actionId: housingRequestId,
      emailData: buildNotificationEmailData('application_approved', {
        listingTitle: housingRequest.listing.title,
        hostName: hostName
      })
    } as CreateNotificationInput;
    
    console.log('📋 Notification data:', notificationData);
    await createNotification(notificationData);
    console.log('✅ Notification created successfully');

    // Revalidate relevant paths
    console.log('🔄 Revalidating paths');
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');
    revalidatePath(`/app/rent/searches/${housingRequest.tripId}`);

    console.log('🎉 approveHousingRequest completed successfully');
    return { success: true, housingRequest: result.updatedRequest, match: result.match };
  } catch (error) {
    console.error('Error approving housing request:', error);
    throw error;
  }
}

// Decline a housing request
export async function declineHousingRequest(housingRequestId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prismadb.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        user: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only decline requests for your own listings');
    }

    // Update the housing request status to declined
    const updatedRequest = await prismadb.housingRequest.update({
      where: { id: housingRequestId },
      data: { status: 'declined' }
    });

    // Create a notification for the applicant
    const notificationData = {
      userId: housingRequest.userId,
      content: `Your application for ${housingRequest.listing.title} has been declined.`,
      url: `/app/rent/searches/${housingRequest.tripId}`,
      actionType: 'application_declined',
      actionId: housingRequestId,
      emailData: buildNotificationEmailData('application_declined', {
        listingTitle: housingRequest.listing.title
      })
    };
    
    await createNotification(notificationData);

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');

    return { success: true, housingRequest: updatedRequest };
  } catch (error) {
    console.error('Error declining housing request:', error);
    throw error;
  }
}

// Undo an approval (revert back to pending and delete the match)
export async function undoApprovalHousingRequest(housingRequestId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prismadb.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        user: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only undo approvals for your own listings');
    }

    if (housingRequest.status !== 'approved') {
      throw new Error('Can only undo approved requests');
    }

    // Start a transaction to ensure both operations succeed or fail together
    const result = await prismadb.$transaction(async (tx) => {
      // Find and delete the match associated with this housing request
      const match = await tx.match.findFirst({
        where: {
          tripId: housingRequest.tripId,
          listingId: housingRequest.listingId
        },
        include: {
          BoldSignLease: true
        }
      });

      if (match) {
        // Check if there's already a booking for this match
        const booking = await tx.booking.findUnique({
          where: { matchId: match.id }
        });

        if (booking) {
          throw new Error('Cannot undo approval: A booking already exists for this match');
        }

        // Delete the BoldSignLease if it exists
        if (match.BoldSignLease) {
          await tx.boldSignLease.delete({
            where: { id: match.BoldSignLease.id }
          });
        }

        // Delete the match
        await tx.match.delete({
          where: { id: match.id }
        });
      }

      // Update the housing request status back to pending and remove boldSignLeaseId
      const updatedRequest = await tx.housingRequest.update({
        where: { id: housingRequestId },
        data: { 
          status: 'pending',
          boldSignLeaseId: null
        }
      });

      // Delete the original approval notification
      await tx.notification.deleteMany({
        where: {
          userId: housingRequest.userId,
          actionType: 'application_approved',
          actionId: housingRequestId
        }
      });

      return { updatedRequest };
    });

    // Create a notification for the applicant
    const notificationData = {
      userId: housingRequest.userId,
      content: `Your approval for ${housingRequest.listing.title} has been revoked.`,
      url: `/app/rent/searches/${housingRequest.tripId}`,
      actionType: 'application_revoked',
      actionId: housingRequestId,
      emailData: {
        listingTitle: housingRequest.listing.title
      }
    };
    
    await createNotification(notificationData);

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');
    revalidatePath(`/app/rent/searches/${housingRequest.tripId}`);

    return { success: true, housingRequest: result.updatedRequest };
  } catch (error) {
    console.error('Error undoing approval:', error);
    throw error;
  }
}

// Undo a decline (revert back to pending)
export async function undoDeclineHousingRequest(housingRequestId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prismadb.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        user: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only undo declines for your own listings');
    }

    if (housingRequest.status !== 'declined') {
      throw new Error('Can only undo declined requests');
    }

    // Start a transaction to ensure both operations succeed or fail together
    const result = await prismadb.$transaction(async (tx) => {
      // Update the housing request status back to pending
      const updatedRequest = await tx.housingRequest.update({
        where: { id: housingRequestId },
        data: { status: 'pending' }
      });

      // Delete the original decline notification
      await tx.notification.deleteMany({
        where: {
          userId: housingRequest.userId,
          actionType: 'application_declined',
          actionId: housingRequestId
        }
      });

      return { updatedRequest };
    });

    // Create a notification for the applicant
    // const notificationData = {
    //   userId: housingRequest.userId,
    //   content: `Your application for ${housingRequest.listing.title} is being reconsidered.`,
    //   url: `/app/rent/searches/${housingRequest.tripId}`,
    //   actionType: 'application_reconsidered',
    //   actionId: housingRequestId,
    // };

    // await createNotification(notificationData);

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');

    return { success: true, housingRequest: result.updatedRequest };
  } catch (error) {
    console.error('Error undoing decline:', error);
    throw error;
  }
}

// Update a housing request with new data
export async function updateHousingRequest(housingRequestId: string, data: { leaseDocumentId?: string | null }) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prismadb.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only update requests for your own listings');
    }

    // Update the housing request
    const updatedRequest = await prismadb.housingRequest.update({
      where: { id: housingRequestId },
      data: data
    });

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');

    return { success: true, housingRequest: updatedRequest };
  } catch (error) {
    console.error('Error updating housing request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

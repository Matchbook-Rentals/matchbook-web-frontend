'use server'
import prisma from '@/lib/prismadb';
import { Lease } from '@prisma/client';
import { createMatch } from './matches';

// Create
export async function createInitialLease(
  docId: string,
  matchId: string,
  landlordId: string,
  primaryTenantId: string,
  secondaryTenantId?: string
): Promise<Lease> {
  console.log('Creating lease with docId:', docId, 'matchId:', matchId, 'landlordId:', landlordId, 'primaryTenantId:', primaryTenantId, 'secondaryTenantId:', secondaryTenantId);
  try {
    const leaseData: any = {
      id: docId,
      matchId,
      landlordId,
      primaryTenantId,
    };

    if (secondaryTenantId) {
      leaseData.secondaryTenantId = secondaryTenantId;
    }

    const lease = await prisma.lease.create({
      data: leaseData,
    });
    console.log('Lease created:', lease);
    return lease;
  } catch (error) {
    console.error('Error creating lease:', error);
    throw error;
  }
}

// Fixed function signature and implemented the requested functionality
export async function createLease(docId: string, housingRequestId: string) {
  try {
    // Fetch the housing request data
    //
    // is this the correct way to grab the trip and listing?
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: { trip: true, listing: { include: { monthlyPricing: true } } },
    });
    console.log('HOUSING REQUEST', housingRequest);
    console.log('LISTING', housingRequest?.listing);
    console.log('TRIP', housingRequest?.trip);
    // Check if housing request exists
    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    // Create a match using the trip and listing data
    let match = await createMatch(housingRequest.trip, housingRequest.listing);

    if (!match.match) {
      console.error('Failed to create match:', match.error);
      throw new Error(`Failed to create match: ${match.error}`);
    }

    // Extract necessary data from the housing request
    const landlord = housingRequest.listing.userId
    const tenant = housingRequest.trip.userId

    // Create the lease using the extracted data
    const lease = await prisma.lease.create({
      data: {
        id: docId,
        matchId: match.match.id,
        landlordId: landlord,
        primaryTenantId: tenant,
        // Add any other fields that need to be populated
      },
    });

    return lease;
  } catch (error) {
    console.error('Error creating lease:', error);
    throw error;
  }
}

// Read
export async function getLeaseById(id: string): Promise<Lease | null> {
  return prisma.lease.findUnique({
    where: { id },
  });
}

export async function getLeaseByMatchId(matchId: string): Promise<Lease | null> {
  return prisma.lease.findUnique({
    where: { matchId },
  });
}

// Update
export async function updateLease(
  id: string,
  data: Partial<Omit<Lease, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Lease> {
  return prisma.lease.update({
    where: { id },
    data,
  });
}

export async function updateBoldSignLease(
  id: string,
  data: Partial<Omit<Lease, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Lease> {
  return prisma.lease.update({
    where: { id },
    data,
  });
}

// Delete
export async function deleteLease(id: string): Promise<Lease> {
  return prisma.lease.delete({
    where: { id },
  });
}

export async function checkSignature(id: string, role: 'Landlord' | 'Tenant'): Promise<boolean | null> {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id },
      select: {
        landlordSigned: true,
        tenantSigned: true,
      },
    });

    if (!lease) {
      return null;
    }

    return role === 'Landlord' ? lease.landlordSigned : lease.tenantSigned;
  } catch (error) {
    console.error('Error checking signature:', error);
    throw error;
  }
}

// Create BoldSign document embed link for lease upload
export async function createBoldSignLeaseFromHousingRequest(housingRequestId: string, leaseFile: File) {
  console.log('=== SERVER ACTION START ===');
  console.log('Starting createBoldSignLeaseFromHousingRequest with:', { 
    housingRequestId, 
    fileName: leaseFile?.name,
    fileSize: leaseFile?.size,
    fileType: leaseFile?.type 
  });
  
  try {
    // STEP 1: Basic validation only
    if (!housingRequestId) {
      throw new Error('Housing request ID is required');
    }

    if (!leaseFile) {
      throw new Error('Lease file is required');
    }

    console.log('Step 1 passed: Basic validation successful');
    
    // Return success for now to test if step 1 works
    return { 
      success: true, 
      data: { 
        embedUrl: 'test-url',
        documentId: 'test-doc-id',
        housingRequestId: housingRequestId
      } 
    };

    // COMMENTED OUT - ALL OTHER STEPS
    /*
    const API_BASE_URL = 'https://api.boldsign.com';
    const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;

    if (!BOLDSIGN_API_KEY) {
      throw new Error('BOLDSIGN_API_KEY is not configured');
    }

    console.log('Fetching housing request...');
    // Get the housing request data
    const housingRequest = await prisma?.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        trip: true,
        listing: {
          include: {
            user: true,
            monthlyPricing: true
          }
        },
        user: true,
      },
    });

    if (!housingRequest) {
      throw new Error('No housingRequest found');
    }

    console.log('Housing request found:', {
      id: housingRequest.id,
      hasTrip: !!housingRequest.trip,
      hasListing: !!housingRequest.listing,
      hasUser: !!housingRequest.user,
      hasListingUser: !!housingRequest.listing?.user
    });

    const tenant = housingRequest.user;
    const landlord = housingRequest.listing.user;

    if (!tenant) {
      throw new Error('Tenant user not found');
    }

    if (!landlord) {
      throw new Error('Landlord user not found');
    }

    console.log('Converting file to base64...');
    // Convert file to base64 for the API
    const fileBuffer = await leaseFile.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    console.log('File converted, size:', base64File.length);

    // Create BoldSign document embed URL from uploaded file
    const documentRequestData = {
      redirectUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/platform/host/${housingRequest.listingId}/applications/${housingRequestId}`,
      showToolbar: true,
      sendViewOption: "PreparePage",
      showSaveButton: true,
      locale: "EN",
      showSendButton: true,
      showPreviewButton: true,
      showNavigationButtons: true,
      showTooltip: false,
      embeddedSendLinkValidTill: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      files: [base64File],
      title: `Lease Agreement for ${housingRequest.listing.locationString}`,
      message: "Please review and sign the lease agreement.",
      signers: [
        {
          name: `${landlord?.firstName} ${landlord?.lastName}`.trim(),
          emailAddress: landlord?.email || "",
          signerOrder: 1,
          signerType: "Signer",
          deliveryMode: "Email",
          locale: "EN",
          signerRole: "Host"
        },
        {
          name: `${tenant?.firstName} ${tenant?.lastName}`.trim(),
          emailAddress: tenant?.email || "",
          signerOrder: 2,
          signerType: "Signer",
          deliveryMode: "Email",
          locale: "EN",
          signerRole: "Tenant"
        }
      ],
      enableSigningOrder: false,
      expiryDateType: "Days",
      expiryValue: 30,
      reminderSettings: {
        enableAutoReminder: true,
        reminderDays: 3,
        reminderCount: 5
      },
      disableEmails: false,
      enablePrintAndSign: true,
      enableReassign: true,
      disableExpiryAlert: false,
      documentInfo: [
        {
          locale: "EN",
          title: `Lease Agreement - ${housingRequest.listing.locationString}`,
          description: `Lease agreement for ${housingRequest.listing.locationString}`
        }
      ],
      AutoDetectFields: true,
      documentDownloadOption: "Combined"
    };

    console.log('Sending request to BoldSign API...');
    console.log('Document request data:', JSON.stringify(documentRequestData, null, 2));

    const response = await fetch(`${API_BASE_URL}/v1/document/createEmbeddedRequestUrl`, {
      method: 'POST',
      headers: {
        'X-API-KEY': BOLDSIGN_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentRequestData),
    });

    console.log('BoldSign API response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('BoldSign document creation failed:', error);
      throw new Error(`BoldSign API error (${response.status}): ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log('Document embed URL created:', result);
    
    return { 
      success: true, 
      data: { 
        embedUrl: result.sendUrl,
        documentId: result.documentId,
        housingRequestId: housingRequestId
      } 
    };
    */
  } catch (error) {
    console.error('=== SERVER ACTION ERROR ===');
    console.error('Error creating BoldSign document embed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=== END SERVER ACTION ERROR ===');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

// Update housing request when BoldSign document is sent
export async function updateHousingRequestWithBoldSignLease(housingRequestId: string, documentId: string) {
  try {
    // Calculate rent and get users for match creation
    const housingRequest = await prisma?.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        trip: true,
        listing: {
          include: {
            user: true,
            monthlyPricing: true
          }
        },
        user: true,
      },
    });

    if (!housingRequest) {
      throw new Error('No housingRequest found');
    }

    const { calculateRent } = await import('@/lib/calculate-rent');
    let monthlyRent = calculateRent({ listing: housingRequest.listing, trip: housingRequest.trip })
    let tenant = housingRequest.user;
    let landlord = housingRequest.listing.user;

    // Find existing match or create if none exists
    let match = await prisma.match.findFirst({
      where: {
        tripId: housingRequest.trip.id,
        listingId: housingRequest.listing.id,
      }
    });

    if (!match) {
      // Create match only if it doesn't exist
      try {
        match = await prisma.match.create({
          data: {
            tripId: housingRequest.trip.id,
            listingId: housingRequest.listing.id,
            monthlyRent,
          }
        });
        console.log('Created new match in updateHousingRequestWithBoldSignLease:', match.id);
      } catch (error) {
        console.log('Match Creation Failed - ', error);
        throw new Error('Match creation failed');
      }
    } else {
      console.log('Found existing match in updateHousingRequestWithBoldSignLease:', match.id);
    }

    // Create BoldSignLease record
    const boldSignLease = await prisma?.boldSignLease.create({
      data: {
        id: documentId,
        matchId: match.id,
        landlordId: landlord.id,
        primaryTenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    if (!boldSignLease) {
      throw new Error('Failed to create BoldSignLease record');
    }

    // Update housing request with the boldSignLeaseId
    await prisma.housingRequest.update({
      where: { id: housingRequestId },
      data: { boldSignLeaseId: boldSignLease.id }
    });
    
    return { success: true, data: { boldSignLeaseId: boldSignLease.id } };
  } catch (error) {
    console.error('Error updating housing request with BoldSign lease:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Remove BoldSign lease and clean up related records
export async function removeBoldSignLease(housingRequestId: string) {
  try {
    // Get the housing request with related data
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        boldSignLease: {
          include: {
            match: true
          }
        }
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (!housingRequest.boldSignLease) {
      throw new Error('No lease found to remove');
    }

    const leaseId = housingRequest.boldSignLease.id;
    const matchId = housingRequest.boldSignLease.matchId;

    // TODO: Optionally cancel the BoldSign document via API
    // const API_BASE_URL = 'https://api.boldsign.com';
    // const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;
    // You might want to call BoldSign API to cancel/delete the document

    // Delete the BoldSignLease record
    await prisma.boldSignLease.delete({
      where: { id: leaseId }
    });

    // Delete the associated Match record
    if (matchId) {
      try {
        await prisma.match.delete({
          where: { id: matchId }
        });
      } catch (error) {
        console.warn('Failed to delete match:', error);
        // Continue even if match deletion fails
      }
    }

    // Update the housing request to remove the boldSignLeaseId and set status back to pending
    await prisma.housingRequest.update({
      where: { id: housingRequestId },
      data: { 
        boldSignLeaseId: null,
        status: 'pending'
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing BoldSign lease:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function formatDate(dateString: Date | string) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}


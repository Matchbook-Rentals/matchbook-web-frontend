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
      include: { trip: true, listing: true },
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


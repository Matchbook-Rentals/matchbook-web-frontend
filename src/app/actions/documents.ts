'use server'
import prisma from '@/lib/prismadb';
import { BoldSignLease } from '@prisma/client';

// Create
export async function createInitialLease(
  docId: string,
  matchId: string,
  landlordId: string,
  primaryTenantId: string,
  secondaryTenantId?: string
): Promise<BoldSignLease> {
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

    const lease = await prisma.boldSignLease.create({
      data: leaseData,
    });
    console.log('Lease created:', lease);
    return lease;
  } catch (error) {
    console.error('Error creating lease:', error);
    throw error;
  }
}

// Read
export async function getBoldSignLeaseById(id: string): Promise<BoldSignLease | null> {
  return prisma.boldSignLease.findUnique({
    where: { id },
  });
}

export async function getBoldSignLeaseByMatchId(matchId: string): Promise<BoldSignLease | null> {
  return prisma.boldSignLease.findUnique({
    where: { matchId },
  });
}

// Update
export async function updateBoldSignLease(
  id: string,
  data: Partial<Omit<BoldSignLease, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<BoldSignLease> {
  return prisma.boldSignLease.update({
    where: { id },
    data,
  });
}

// Delete
export async function deleteBoldSignLease(id: string): Promise<BoldSignLease> {
  return prisma.boldSignLease.delete({
    where: { id },
  });
}

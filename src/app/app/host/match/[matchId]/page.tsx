import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import HostMatchClient from './host-match-client';

interface HostMatchPageProps {
  params: { matchId: string };
}

async function getMatchForHost(matchId: string) {
  const { userId } = auth();
  if (!userId) return null;

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        BoldSignLease: true,
        Lease: true,
        trip: {
          include: {
            user: true
          }
        },
        listing: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                stripeAccountId: true
              }
            },
            listingImages: true
          }
        }
      }
    });

    // Verify the match belongs to a listing owned by the current user (host)
    if (!match || match.listing.userId !== userId) {
      return null;
    }

    return match;
  } catch (error) {
    console.error('Error fetching match for host:', error);
    return null;
  }
}

export default async function HostMatchPage({ params }: HostMatchPageProps) {
  const match = await getMatchForHost(params.matchId);

  if (!match) {
    return notFound();
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    }>
      <HostMatchClient match={match} matchId={params.matchId} />
    </Suspense>
  );
}
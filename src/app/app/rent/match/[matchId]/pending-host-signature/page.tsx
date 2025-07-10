import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prismadb';
import { PendingHostSignatureClient } from './pending-host-signature-client';

interface PendingHostSignaturePageProps {
  params: { matchId: string };
}

export default async function PendingHostSignaturePage({ params }: PendingHostSignaturePageProps) {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Get the match with all necessary relations
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      trip: { 
        include: { user: true } 
      },
      listing: { 
        include: { user: true } 
      },
      BoldSignLease: true,
      booking: true,
    }
  });

  if (!match) {
    redirect('/app/dashboard');
  }

  // Verify the user is the renter
  if (match.trip.user?.id !== userId) {
    redirect('/app/dashboard');
  }

  // Verify that the tenant has signed and payment is authorized
  const isLeaseSigned = match.BoldSignLease?.tenantSigned || false;
  const isPaymentAuthorized = !!match.paymentAuthorizedAt;

  if (!isLeaseSigned || !isPaymentAuthorized) {
    redirect(`/app/match/${params.matchId}`);
  }

  return (
    <PendingHostSignatureClient 
      match={match} 
      matchId={params.matchId} 
    />
  );
}
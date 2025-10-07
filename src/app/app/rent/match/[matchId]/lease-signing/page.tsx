import { getMatchById } from '@/app/actions/matches';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { LeaseSigningClient } from '../lease-signing-client';

interface LeaseSigningPageProps {
  params: { matchId: string };
}

export default async function LeaseSigningPage({ params }: LeaseSigningPageProps) {
  // Get current user's email from Clerk auth
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user email from database
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!currentUser?.email) {
    throw new Error('User email not found');
  }

  const result = await getMatchById(params.matchId);

  if (!result.success || !result.match) {
    notFound();
  }

  const match = result.match;
  
  console.log('🔍 [Lease Signing Page] Match state:', {
    matchId: params.matchId,
    hasLeaseDocument: !!match.leaseDocumentId,
    tenantSignedAt: match.tenantSignedAt,
    paymentAuthorizedAt: match.paymentAuthorizedAt,
    paymentCapturedAt: match.paymentCapturedAt
  });
  
  // Redirect if no lease document
  if (!match.leaseDocumentId) {
    console.log('⚠️ [Lease Signing Page] Redirecting to awaiting-lease: no lease document');
    redirect(`/app/rent/match/${params.matchId}/awaiting-lease`);
  }
  
  // Redirect if already completed payment
  if (match.paymentAuthorizedAt) {
    console.log('⚠️ [Lease Signing Page] Redirecting to complete: payment already authorized');
    redirect(`/app/rent/match/${params.matchId}/complete`);
  }
  
  const isAdminDev = await checkRole('admin_dev');
  
  // Determine initial step based on match state
  let serverInitialStep = 'overview-lease';
  if (match.tenantSignedAt) {
    serverInitialStep = 'complete-payment';
  }
  
  return (
    <LeaseSigningClient
      match={match}
      matchId={params.matchId}
      isAdminDev={isAdminDev}
      initialStep={serverInitialStep}
      currentUserEmail={currentUser.email}
    />
  );
}
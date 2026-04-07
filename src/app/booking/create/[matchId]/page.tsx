import { getMatchById } from '@/app/actions/matches';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { LeaseSigningClient } from './lease-signing-client';
import { AwaitingLeaseClient } from './awaiting-lease-client';

interface LeaseSigningPageProps {
  params: { matchId: string };
}

export default async function LeaseSigningPage({ params }: LeaseSigningPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!dbUser?.email) {
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

  // TODO: temporarily always show the new booking review UI for development
  // Original condition: if (!match.leaseDocumentId)
  return (
    <AwaitingLeaseClient
      match={match}
      matchId={params.matchId}
      isAdminDev={await checkRole('admin_dev')}
    />
  );

  // Redirect if booking already created
  if (match.booking) {
    redirect(`/booking/create/${params.matchId}/complete`);
  }

  const isAdminDev = await checkRole('admin_dev');

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
      currentUserEmail={dbUser.email}
    />
  );
}

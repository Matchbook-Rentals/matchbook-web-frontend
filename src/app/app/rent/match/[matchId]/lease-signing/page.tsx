import { getMatchById } from '@/app/actions/matches';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { LeaseSigningClient } from '../lease-signing-client';

interface LeaseSigningPageProps {
  params: { matchId: string };
}

export default async function LeaseSigningPage({ params }: LeaseSigningPageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    notFound();
  }
  
  const match = result.match;
  
  // Redirect if no lease document
  if (!match.leaseDocumentId) {
    redirect(`/app/rent/match/${params.matchId}/awaiting-lease`);
  }
  
  // Redirect if already completed payment
  if (match.paymentAuthorizedAt) {
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
    />
  );
}
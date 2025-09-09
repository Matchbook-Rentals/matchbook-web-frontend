import { getMatchById } from '@/app/actions/matches';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { CompleteClient } from './complete-client';

interface CompletePageProps {
  params: { matchId: string };
}

export default async function CompletePage({ params }: CompletePageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    notFound();
  }
  
  const match = result.match;
  
  // Redirect if not complete
  if (!match.leaseDocumentId) {
    redirect(`/app/rent/match/${params.matchId}/awaiting-lease`);
  }
  
  if (!match.tenantSignedAt) {
    redirect(`/app/rent/match/${params.matchId}/review`);
  }
  
  if (!match.paymentAuthorizedAt) {
    redirect(`/app/rent/match/${params.matchId}/payment`);
  }
  
  const isAdminDev = await checkRole('admin_dev');
  
  return (
    <CompleteClient 
      match={match}
      matchId={params.matchId}
      isAdminDev={isAdminDev}
    />
  );
}
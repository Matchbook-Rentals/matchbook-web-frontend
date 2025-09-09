import { getMatchById } from '@/app/actions/matches';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { ReviewLeaseClient } from './review-lease-client';

interface ReviewLeasePageProps {
  params: { matchId: string };
}

export default async function ReviewLeasePage({ params }: ReviewLeasePageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    notFound();
  }
  
  const match = result.match;
  
  // Redirect based on state
  if (!match.leaseDocumentId) {
    redirect(`/app/rent/match/${params.matchId}/awaiting-lease`);
  }
  
  if (match.tenantSignedAt) {
    if (!match.paymentAuthorizedAt) {
      redirect(`/app/rent/match/${params.matchId}/payment`);
    } else {
      redirect(`/app/rent/match/${params.matchId}/complete`);
    }
  }
  
  const isAdminDev = await checkRole('admin_dev');
  
  return (
    <ReviewLeaseClient 
      match={match}
      matchId={params.matchId}
      isAdminDev={isAdminDev}
    />
  );
}
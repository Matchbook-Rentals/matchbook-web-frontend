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
  
  console.log('🔍 [Complete Page] Match state:', {
    matchId: params.matchId,
    hasLeaseDocument: !!match.leaseDocumentId,
    tenantSignedAt: match.tenantSignedAt,
    paymentAuthorizedAt: match.paymentAuthorizedAt,
    paymentCapturedAt: match.paymentCapturedAt
  });
  
  // Redirect if not complete
  if (!match.leaseDocumentId) {
    console.log('⚠️ [Complete Page] Redirecting to awaiting-lease: no lease document');
    redirect(`/app/rent/match/${params.matchId}/awaiting-lease`);
  }
  
  // TODO: We might bring back the lease signing requirement later
  // For now, commenting out to prevent redirect loop when payment is done but signing isn't
  // if (!match.tenantSignedAt) {
  //   console.log('⚠️ [Complete Page] Redirecting to lease-signing: tenant not signed');
  //   redirect(`/app/rent/match/${params.matchId}/lease-signing`);
  // }
  
  if (!match.paymentAuthorizedAt) {
    console.log('⚠️ [Complete Page] Redirecting to payment: payment not authorized');
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
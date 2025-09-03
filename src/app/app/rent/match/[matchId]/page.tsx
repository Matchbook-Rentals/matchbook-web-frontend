import { getMatchById } from '@/app/actions/matches';
import { LeaseSigningClient } from './lease-signing-client';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';

interface MatchLeasePageProps {
  params: { matchId: string };
}

export default async function MatchLeasePage({ params }: MatchLeasePageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    console.log('🔍 SERVER STATE LOG - Match not found:', {
      matchId: params.matchId,
      success: result.success,
      hasMatch: !!result.match
    });
    notFound();
  }
  
  const match = result.match;
  
  // Determine initial step server-side to prevent flickering
  const determineInitialStep = () => {
    if (!match.leaseDocumentId) return 'no-lease-document';
    if (!match.tenantSignedAt) return 'overview-lease';
    if (!match.paymentAuthorizedAt) return 'complete-payment';
    return 'completed';
  };
  
  const initialStep = determineInitialStep();
  
  // Log comprehensive match state for step decision
  console.log('🔍 SERVER STATE LOG - Initial step determination:', {
    matchId: params.matchId,
    leaseDocumentId: match.leaseDocumentId,
    hasLeaseDocument: !!match.leaseDocumentId,
    tenantSignedAt: match.tenantSignedAt,
    hasRenterSignature: !!match.tenantSignedAt,
    paymentAuthorizedAt: match.paymentAuthorizedAt,
    hasPaymentCompleted: !!match.paymentAuthorizedAt,
    landlordSignedAt: match.landlordSignedAt,
    hasHostSignature: !!match.landlordSignedAt,
    currentTimestamp: new Date().toISOString(),
    initialStep: initialStep,
    stepReason: (() => {
      if (!match.leaseDocumentId) return 'No lease document exists';
      if (!match.tenantSignedAt) return 'Lease not signed by renter - show overview/signing';
      if (!match.paymentAuthorizedAt) return 'Lease signed but payment incomplete - show payment';
      return 'Both lease signed and payment completed - show completion';
    })()
  });
  
  console.log('📄 SERVER RENDER - Rendering lease signing interface with initial step:', {
    matchId: params.matchId,
    initialStep: initialStep
  });
  
  // Check if user has admin_dev role
  const isAdminDev = await checkRole('admin_dev');
  
  return (
    <LeaseSigningClient 
      match={match}
      matchId={params.matchId}
      isAdminDev={isAdminDev}
      initialStep={initialStep}
    />
  );
}
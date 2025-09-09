import { getMatchById } from '@/app/actions/matches';
import { notFound, redirect } from 'next/navigation';

interface MatchLeasePageProps {
  params: { matchId: string };
}

export default async function MatchLeasePage({ params }: MatchLeasePageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    notFound();
  }
  
  const match = result.match;
  
  // Redirect to the appropriate step based on match state
  if (!match.leaseDocumentId) {
    redirect(`/app/rent/match/${params.matchId}/awaiting-lease`);
  } else if (!match.paymentAuthorizedAt) {
    // Use single lease-signing page for review, sign, and payment steps
    redirect(`/app/rent/match/${params.matchId}/lease-signing`);
  } else {
    redirect(`/app/rent/match/${params.matchId}/complete`);
  }
}
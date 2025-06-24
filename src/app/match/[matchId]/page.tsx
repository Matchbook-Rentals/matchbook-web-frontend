import { getMatchById } from '@/app/actions/matches';
import { LeaseSigningClient } from './lease-signing-client';
import { notFound } from 'next/navigation';

interface MatchLeasePageProps {
  params: { matchId: string };
}

export default async function MatchLeasePage({ params }: MatchLeasePageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    notFound();
  }
  
  return (
    <LeaseSigningClient 
      match={result.match}
      matchId={params.matchId}
    />
  );
}
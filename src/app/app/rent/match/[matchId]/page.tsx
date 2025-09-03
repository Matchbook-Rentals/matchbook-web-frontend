import { getMatchById } from '@/app/actions/matches';
import { LeaseSigningClient } from './lease-signing-client';
import { notFound } from 'next/navigation';
import { checkRole } from '@/utils/roles';

interface MatchLeasePageProps {
  params: { matchId: string };
}

export default async function MatchLeasePage({ params }: MatchLeasePageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    notFound();
  }
  
  // Check if user has admin_dev role
  const isAdminDev = await checkRole('admin_dev');
  
  return (
    <LeaseSigningClient 
      match={result.match}
      matchId={params.matchId}
      isAdminDev={isAdminDev}
    />
  );
}
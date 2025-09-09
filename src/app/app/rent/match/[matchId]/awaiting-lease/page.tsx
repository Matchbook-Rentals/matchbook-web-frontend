import { getMatchById } from '@/app/actions/matches';
import { notFound } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { AwaitingLeaseClient } from './awaiting-lease-client';

interface AwaitingLeasePageProps {
  params: { matchId: string };
}

export default async function AwaitingLeasePage({ params }: AwaitingLeasePageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    notFound();
  }
  
  const match = result.match;
  const isAdminDev = await checkRole('admin_dev');
  
  return (
    <AwaitingLeaseClient 
      match={match}
      matchId={params.matchId}
      isAdminDev={isAdminDev}
    />
  );
}
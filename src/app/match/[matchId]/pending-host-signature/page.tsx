import { redirect } from 'next/navigation';

interface PendingHostSignatureRedirectPageProps {
  params: { matchId: string };
}

export default async function PendingHostSignatureRedirectPage({ params }: PendingHostSignatureRedirectPageProps) {
  // Redirect to the new platform route
  redirect(`/platform/match/${params.matchId}/pending-host-signature`);
}
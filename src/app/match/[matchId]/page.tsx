import { redirect } from 'next/navigation';

interface MatchRedirectPageProps {
  params: { matchId: string };
}

export default async function MatchRedirectPage({ params }: MatchRedirectPageProps) {
  // Redirect to the new platform route
  redirect(`/platform/match/${params.matchId}`);
}
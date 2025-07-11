import { redirect } from 'next/navigation';

interface PaymentSuccessRedirectPageProps {
  params: { matchId: string };
}

export default async function PaymentSuccessRedirectPage({ params }: PaymentSuccessRedirectPageProps) {
  // Redirect to the new platform route
  redirect(`/app/match/${params.matchId}/payment-success`);
}
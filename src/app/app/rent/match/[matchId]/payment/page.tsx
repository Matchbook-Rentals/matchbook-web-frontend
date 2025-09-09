import { getMatchById } from '@/app/actions/matches';
import { getUserPaymentMethods } from '@/app/actions/payment-methods';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { PaymentSetupClient } from './payment-setup-client';

interface PaymentSetupPageProps {
  params: { matchId: string };
}

export default async function PaymentSetupPage({ params }: PaymentSetupPageProps) {
  const result = await getMatchById(params.matchId);
  
  if (!result.success || !result.match) {
    notFound();
  }
  
  const match = result.match;
  
  // Redirect based on state
  if (!match.leaseDocumentId) {
    redirect(`/app/rent/match/${params.matchId}/awaiting-lease`);
  }
  
  if (!match.tenantSignedAt) {
    redirect(`/app/rent/match/${params.matchId}/lease-signing`);
  }
  
  if (match.paymentAuthorizedAt) {
    redirect(`/app/rent/match/${params.matchId}/complete`);
  }
  
  const isAdminDev = await checkRole('admin_dev');
  
  // Fetch payment methods server-side
  const paymentMethodsResult = await getUserPaymentMethods();
  const paymentMethods = paymentMethodsResult.success ? paymentMethodsResult.paymentMethods || [] : [];
  
  return (
    <PaymentSetupClient 
      match={match}
      matchId={params.matchId}
      isAdminDev={isAdminDev}
      paymentMethods={paymentMethods}
    />
  );
}
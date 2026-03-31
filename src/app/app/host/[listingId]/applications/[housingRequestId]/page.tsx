import { ApplicationDetails } from './application-details';
import { getHousingRequestById } from '@/app/actions/housing-requests';
import { getHostUserData } from '@/app/actions/user';
import { isHostAccountActive, isHostOnboardingComplete } from '@/lib/verification-utils';
import { redirect } from 'next/navigation';

interface ApplicationDetailsPageProps {
  params: { listingId: string; housingRequestId: string };
  searchParams: { from?: string };
}

const ApplicationDetailsPage = async ({ params, searchParams }: ApplicationDetailsPageProps) => {
  const [housingRequest, hostUserData] = await Promise.all([
    getHousingRequestById(params.housingRequestId),
    getHostUserData(),
  ]);

  // Block if onboarding is not complete
  if (!isHostOnboardingComplete(hostUserData)) {
    redirect(`/app/host/${params.listingId}/applications`);
  }

  // Block if Stripe account is inactive
  const isHostActive = isHostAccountActive(hostUserData);
  if (!isHostActive) {
    redirect(`/app/host/${params.listingId}/applications`);
  }

  return <ApplicationDetails housingRequestId={params.housingRequestId} housingRequest={housingRequest} listingId={params.listingId} from={searchParams.from} isHostActive={isHostActive} />;
};

export default ApplicationDetailsPage;

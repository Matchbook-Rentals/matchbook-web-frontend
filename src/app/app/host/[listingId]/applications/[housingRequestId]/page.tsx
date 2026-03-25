import { ApplicationDetails } from './application-details';
import { getHousingRequestById } from '@/app/actions/housing-requests';
import { getHostUserData } from '@/app/actions/user';
import { isHostAccountActive } from '@/lib/verification-utils';

interface ApplicationDetailsPageProps {
  params: { listingId: string; housingRequestId: string };
  searchParams: { from?: string };
}

const ApplicationDetailsPage = async ({ params, searchParams }: ApplicationDetailsPageProps) => {
  const [housingRequest, hostUserData] = await Promise.all([
    getHousingRequestById(params.housingRequestId),
    getHostUserData(),
  ]);
  const isHostActive = isHostAccountActive(hostUserData);

  return <ApplicationDetails housingRequestId={params.housingRequestId} housingRequest={housingRequest} listingId={params.listingId} from={searchParams.from} isHostActive={isHostActive} />;
};

export default ApplicationDetailsPage;
import { ApplicationDetails } from './application-details';
import { getHousingRequestById } from '@/app/actions/housing-requests';

interface ApplicationDetailsPageProps {
  params: { listingId: string; housingRequestId: string };
  searchParams: { from?: string };
}

const ApplicationDetailsPage = async ({ params, searchParams }: ApplicationDetailsPageProps) => {
  const housingRequest = await getHousingRequestById(params.housingRequestId);
  
  return <ApplicationDetails housingRequestId={params.housingRequestId} housingRequest={housingRequest} listingId={params.listingId} from={searchParams.from} />;
};

export default ApplicationDetailsPage;
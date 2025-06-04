import { ApplicationDetails } from './application-details';
import { getHousingRequestById } from '@/app/actions/housing-requests';

interface ApplicationDetailsPageProps {
  params: { listingId: string; housingRequestId: string };
}

const ApplicationDetailsPage = async ({ params }: ApplicationDetailsPageProps) => {
  const housingRequest = await getHousingRequestById(params.housingRequestId);
  
  return <ApplicationDetails housingRequestId={params.housingRequestId} housingRequest={housingRequest} listingId={params.listingId} />;
};

export default ApplicationDetailsPage;
import { ApplicationDetails } from './application-details';
import { getHousingRequestById } from '@/app/actions/housing-requests';

interface ApplicationDetailsPageProps {
  params: { applicationId: string };
  searchParams: { from?: string };
}

const ApplicationDetailsPage = async ({ params, searchParams }: ApplicationDetailsPageProps) => {
  const housingRequest = await getHousingRequestById(params.applicationId);
  
  return (
    <ApplicationDetails 
      applicationId={params.applicationId} 
      housingRequest={housingRequest} 
      from={searchParams.from} 
    />
  );
};

export default ApplicationDetailsPage;
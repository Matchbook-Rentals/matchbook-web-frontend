import { ApplicationDetails } from './application-details';
import { getHousingRequestById } from '@/app/actions/housing-requests';

interface ApplicationDetailsPageProps {
  params: { applicationId: string };
  searchParams: { from?: string };
}

const ApplicationDetailsPage = async ({ params, searchParams }: ApplicationDetailsPageProps) => {
  const housingRequest = await getHousingRequestById(params.applicationId);
  
  return (
    <div className="max-w-[1280px] mx-auto w-full">
      <ApplicationDetails
        applicationId={params.applicationId}
        housingRequest={housingRequest}
        from={searchParams.from}
      />
    </div>
  );
};

export default ApplicationDetailsPage;
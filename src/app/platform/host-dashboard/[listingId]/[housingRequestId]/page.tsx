import { WebApplication } from './web-application';

interface ApplicationDetailsPageProps {
  params: { listingId: string; housingRequestId: string };
}

const ApplicationDetailsPage = ({ params }: ApplicationDetailsPageProps) => {
  return <WebApplication />;
};

export default ApplicationDetailsPage;
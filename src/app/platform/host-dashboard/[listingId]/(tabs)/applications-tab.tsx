import React, { useEffect, useState } from 'react';
import ApplicationsSidebar from '../(components)/applications-sidebar';
import { ListingAndImages, RequestWithUser } from '@/types';
import ApplicationDetails from '../(components)/application-details';

interface ApplicationsTabProps {
  listing: ListingAndImages; // Replace 'any' with the actual type of listing
  housingRequests: RequestWithUser[]; // Replace 'any[]' with the actual type of housingRequests
  setHousingRequests: React.Dispatch<React.SetStateAction<RequestWithUser[]>>; // Replace 'any[]' with the actual type of housingRequests
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ listing, housingRequests, setHousingRequests }) => {
  const [selectedApplication, setSelectedApplication] = useState<RequestWithUser | null>(housingRequests[0] || null);

  useEffect(() => {
    if (housingRequests.length > 0) {
      setSelectedApplication(housingRequests[0]);
    } else {
      setSelectedApplication(null);
    }
  }, [housingRequests]);

  return (
    <div className="w-full p-5">
      <button onClick={() => console.log(housingRequests)}>LOG HOUSING REQUESTS</button>
      <button onClick={() => console.log(selectedApplication)}>LOG SELECTED APPLICATION</button>
      <div className="flex gap-x-4">
        <div className="w-[25%]">
          <ApplicationsSidebar housingRequests={housingRequests} setSelectedApplication={setSelectedApplication} />
        </div>
        <div className="w-[70%] h-[200vh]">
          <ApplicationDetails selectedApplication={selectedApplication} />
        </div>
      </div>
    </div>
  );
}

export default ApplicationsTab;
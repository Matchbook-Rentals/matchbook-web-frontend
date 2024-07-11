import React, { useEffect, useState } from 'react';
import ApplicationsSidebar from '../(components)/applications-sidebar';
import { ListingAndImages, RequestWithUser } from '@/types';

interface ApplicationsTabProps {
  listing: ListingAndImages; // Replace 'any' with the actual type of listing
  housingRequests: RequestWithUser[]; // Replace 'any[]' with the actual type of housingRequests
  setHousingRequests: React.Dispatch<React.SetStateAction<RequestWithUser[]>>; // Replace 'any[]' with the actual type of housingRequests
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ listing, housingRequests, setHousingRequests }) => {
  return (
    <div className="w-full p-5">
      <div className="flex gap-x-4">
        <div className="w-1/5 max-w-[500px]">
          <ApplicationsSidebar housingRequests={housingRequests} />
        </div>
        <div className="w-4/5 h-[200vh]">
          {/* Content area */}
        </div>
      </div>
    </div>
  );
}

export default ApplicationsTab;


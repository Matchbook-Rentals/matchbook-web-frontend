
import React, { useEffect, useState } from 'react';
import { useHostProperties } from '@/contexts/host-properties-provider';
import ApplicationsSidebar from '../(components)/applications-sidebar';

const ApplicationsTab: React.FC = () => {
  const { getListingHousingRequests } = useHostProperties();
  const [housingRequests, setHousingRequests] = useState([]);

  useEffect(() => {
    const fetchHousingRequests = async () => {
      try {
        const requests = await getListingHousingRequests('asdf');
        setHousingRequests(requests);
      } catch (error) {
        console.error('Error fetching housing requests:', error);
      }
    };

    fetchHousingRequests();
  }, [getListingHousingRequests]);

  // Removing the map and keeping only one sidebar
  return (
    <div className="w-full p-5">
      <div className="grid grid-cols-12 gap-2.5">
        <div className=" text-center col-span-2">
          <ApplicationsSidebar housingRequests={housingRequests} />
        </div>
        <div className="col-span-6 h-[200vh]">
          {/* Content area */}
        </div>
      </div>
    </div>
  );
}

export default ApplicationsTab;

import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { RequestWithUser } from '@/types';

interface ApplicationsSidebarProps {
  housingRequests: RequestWithUser[];
  setSelectedApplication: React.Dispatch<React.SetStateAction<RequestWithUser | null>>;
}

const ApplicationCard: React.FC<{
  request: RequestWithUser;
  setSelectedApplication: React.Dispatch<React.SetStateAction<RequestWithUser | null>>;
}> = ({ request, setSelectedApplication }) => {
  let requesterName = '';

  request.user.firstName && (requesterName += request.user.firstName + ' ');
  request.user.lastName && (requesterName += request.user.lastName);
  requesterName = requesterName || request.user.email || '';

  return (
    <Card
      className="mb-2 bg-gray-300 border flex py-3 cursor-pointer"
      onClick={() => setSelectedApplication(request)}
    >
      <div className="w-[15%] flex justify-center items-center">
        <img alt='user-image' src={`${request.user.imageUrl}`} className='rounded-full w-8 h-8 ' />
      </div>
      <div className="w-4/5 flex  flex-col">
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold text-xs">{requesterName.trim().slice(0, 18) + '...'}</h3>
          <p className="text-xs ">Move in: {request.startDate.toLocaleDateString()}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm">5 adults, 2 children, 2 pets</p>
          <p className="text-sm text-gray-500">12m</p>
        </div>
      </div>
    </Card>
  );
}

const ApplicationsSidebar: React.FC<ApplicationsSidebarProps> = ({ housingRequests, setSelectedApplication }) => {
  return (
    <div className="w-full md:sticky md:top-40">
      <h2 className="text-xl font-semibold text-center pb-2">Applications</h2>
      <ScrollArea className="h-[70vh] w-full border-2 border-grey-500 p-1 shadow-lg rounded-xl">
        {housingRequests.map((request) => (
          <ApplicationCard
            key={request.id}
            request={request}
            setSelectedApplication={setSelectedApplication}
          />
        ))}
      </ScrollArea>
    </div>
  );
};

export default ApplicationsSidebar;
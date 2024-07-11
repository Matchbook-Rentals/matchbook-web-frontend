import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { HousingRequest } from '@prisma/client';
import { RequestWithUser } from '@/types';



interface ApplicationsSidebarProps {
  housingRequests: RequestWithUser[];
}
const ApplicationCard: React.FC<{ request: RequestWithUser }> = ({ request }) => {
  let requesterName = '';

  request.user.firstName && (requesterName += request.user.firstName);
  request.user.lastName && (requesterName += request.user.lastName);
  requesterName = requesterName || request.user.email || '';

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <h3 className="font-semibold">{requesterName}</h3>
        <p className="text-sm text-gray-500">Moved in: {request.startDate.toLocaleDateString()}</p>
        <p className="text-sm text-gray-500">Moved out: {request.endDate.toLocaleDateString()}</p>
      </CardContent>
    </Card>
  );
};

const ApplicationsSidebar: React.FC<ApplicationsSidebarProps> = ({ housingRequests }) => {
  return (
    <div className="w-full md:sticky md:top-40">
      <div className="">
        <h2 className="text-xl font-semibold pb-2">Applications</h2>
      </div>
      <ScrollArea className="h-[70vh] border border-grey-400 shadow-lg rounded-xl">
        <div className="p-4">
          {housingRequests.map((request) => (
            <ApplicationCard key={request.id} request={request} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ApplicationsSidebar;

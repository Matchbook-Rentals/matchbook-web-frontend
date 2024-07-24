import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestWithUser } from "@/types/";
import ApplicationSummary from './applications-summary';

const ApplicationDetails = ({ selectedApplication }: { selectedApplication: RequestWithUser }) => {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <ApplicationSummary
        trip={selectedApplication?.trip}
        application={selectedApplication?.user?.applications[0]}
      />
      <CardContent>
        <h3 className="text-xl font-semibold mb-4">Applicants</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className={i < 2 ? "bg-blue-100" : "bg-gray-100"}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <img
                    alt='user-image'
                    src={selectedApplication?.user?.imageUrl}
                    className='rounded-full w-8 h-8 mr-3'
                  />
                  <div>
                    <p className="font-semibold">Daniel Resner</p>
                    <Badge variant={i < 2 ? "secondary" : "outline"}>
                      {i < 2 ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
                <span>⭐ 4.9</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <h3 className="text-xl font-semibold mb-4">Identity Verification</h3>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p>ID Type: Driver License</p>
            <p>ID Number: 2837462736</p>
          </div>
          <Button variant="outline">Click to View</Button>
        </div>
        <h3 className="text-xl font-semibold mb-4">Employment and Income</h3>
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <p className="font-semibold">Northrop Grumman</p>
                <p>$ 2800.00 /m</p>
              </div>
              <Button variant="outline">Click to View</Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default ApplicationDetails;
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RequestWithUser } from "@/types/";
import ApplicationSummary from './applications-summary';
import ApplicantCard from './applicant-card';
import ApplicationIdentity from './application-identity';
import ApplicationIncomes from './application-incomes';

const ApplicationDetails = ({ selectedApplication }: { selectedApplication: RequestWithUser }) => {
  const application = selectedApplication?.user?.applications[0];

  if (!application) {
    return <div>No application data available</div>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <ApplicationSummary
        trip={selectedApplication?.trip}
        application={application}
      />
      <CardContent>
        <h3 className="text-xl font-semibold mb-4">Applicants</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <ApplicantCard
              key={i}
              imageUrl={selectedApplication.user?.imageUrl}
              name={application?.firstName + ' ' + application?.lastName}
              isVerified={i < 2}
              rating={4.9}
            />
          ))}
        </div>
        <ApplicationIdentity
          identifications={application.identifications || []}
          verificationImages={application.verificationImages || []}
        />
        <ApplicationIncomes
          incomes={application.incomes || []}
          verificationImages={application.verificationImages || []}
        />
      </CardContent>
    </Card>
  );
};

export default ApplicationDetails;
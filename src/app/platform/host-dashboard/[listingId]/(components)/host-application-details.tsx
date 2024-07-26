import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RequestWithUser } from "@/types/";
import ApplicationSummary from './host-applications-summary';
import ApplicantCard from './host-applicant-card';
import ApplicationIdentity from './host-application-identity';
import ApplicationIncomes from './host-application-incomes';
import ApplicationCriminalHistory from './host-application-criminal-history';
import ApplicationResidentHistory from './host-application-resident-history';

const ApplicationDetails = ({ selectedApplication }: { selectedApplication: RequestWithUser }) => {
  const application = selectedApplication?.user?.applications[0];

  if (!application) {
    return <div>No application data available</div>;
  }
  application.criminalRecords = [
    {
      id: '1',
      description: 'Criminal record 1',
      status: 'mocked',
    },
  ];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <ApplicationSummary
        trip={selectedApplication?.trip}
        application={application}
      />
      <CardContent>
        <h3 className="text-2xl text-center font-semibold mb-4">Applicants</h3>
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
        <ApplicationCriminalHistory
          criminalRecords={application.criminalRecords || []}
          application={application}
        />
        <ApplicationResidentHistory
          application={application}
        />
      </CardContent>

    </Card>
  );
};

export default ApplicationDetails;
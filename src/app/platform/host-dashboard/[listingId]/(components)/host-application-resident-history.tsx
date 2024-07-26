import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from '@prisma/client';

interface ApplicationResidentHistoryProps {
  application: Application;
}

const ApplicationResidentHistory: React.FC<ApplicationResidentHistoryProps> = ({ application }) => {
  const calculateDatesOfTenancy = (durationInMonths: number) => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(endDate.getMonth() - durationInMonths);

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl text-center font-bold">Resident History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h4 className="font-semibold text-center mb-2">Current Residence</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Street: </span>
              {application.currentStreet}
            </div>

            {application.currentApt && (
              <div>
                <span className="font-semibold">Apt: </span>
                {application.currentApt}
              </div>
            )}

            <div>
              <span className="font-semibold">City: </span>
              {application.currentCity}
            </div>

            <div>
              <span className="font-semibold">State: </span>
              {application.currentState}
            </div>

            <div>
              <span className="font-semibold">Zip: </span>
              {application.currentZipCode}
            </div>

            <div>
              <span className="font-semibold">Housing Status: </span>
              {application.housingStatus}
            </div>

            <div>
              <span className="font-semibold">Monthly Payment: </span>
              {application.monthlyPayment}
            </div>

            <div>
              <span className="font-semibold">Landlord First Name: </span>
              {application.landlordFirstName}
            </div>

            <div>
              <span className="font-semibold">Landlord Last Name: </span>
              {application.landlordLastName}
            </div>

            <div>
              <span className="font-semibold">Landlord Email: </span>
              {application.landlordEmail}
            </div>

            <div>
              <span className="font-semibold">Landlord Phone Number: </span>
              {application.landlordPhoneNumber}
            </div>

            <div>
              <span className="font-semibold">Length of Tenancy: </span>
              {application.durationOfTenancy}
            </div>

            <div>
              <span className="font-semibold">Dates of Tenancy: </span>
              {calculateDatesOfTenancy(parseInt(application.durationOfTenancy))}
              {' '} (calculated not input by user needs either dates or more refined duration input)
            </div>
          </div>
        </div>
        <div className='space-y-4'>
          <h4 className="font-semibold text-lg text-center mb-2">Tenant review from {application.landlordEmail}:</h4>
          <div className="flex flex-col items-center">
            <span className="text-center">How would you describe the tenant&apos;s payment history?: </span>
            <span className="font-semibold text-center">Placeholder text</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-center">How did the tenant maintain the property?: </span>
            <span className="font-semibold text-center">Placeholder text</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-center">Did you encounter any issues with the tenant during their stay?: </span>
            <span className="font-semibold text-center">Placeholder text</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationResidentHistory;
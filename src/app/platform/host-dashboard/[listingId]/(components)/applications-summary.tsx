import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Application, Trip } from '@prisma/client';
import { ApplicationWithArrays } from '@/types/';
import { useHostProperties } from '@/contexts/host-properties-provider';

interface ApplicationSummaryProps {
  trip: Trip;
  application: ApplicationWithArrays;
}

const ApplicationSummary: React.FC<ApplicationSummaryProps> = ({ trip, application }) => {
  const totalMonthlyIncome = application?.incomes?.length > 0 && application.incomes.reduce((acc, income) => acc + income.monthlyAmount, '');

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Summary {application?.firstName || 'N/A'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>{trip?.numAdults} Adults {trip?.numChildren} children {trip?.numPets} pets</div>
          <div>Move in: {trip?.startDate?.toLocaleDateString() || 'Flexible'}</div>
          <div>Move out: {trip?.endDate?.toLocaleDateString() || 'Flexible'}</div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>Avg rating: ⭐ 4.9</div>
          <div>Total Income: $ {totalMonthlyIncome}</div>
          <div>Rent to Income Ratio: 3:1</div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>Criminal history: 🚩 Flag symbol</div>
          <div>Evictions: Two flag</div>
          <div>Avg Credit: E (800-850)</div>
        </div>
        <div className="flex justify-between mb-6">
          <Button className="w-[48%] bg-green-600 hover:bg-green-700">Approve</Button>
          <Button className="w-[48%] bg-red-600 hover:bg-red-700">Disapprove</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationSummary;
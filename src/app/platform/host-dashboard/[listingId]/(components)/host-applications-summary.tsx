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
  const { currListing } = useHostProperties();
  const totalMonthlyIncome = application?.incomes?.length > 0 && application.incomes.reduce((acc, income) => acc + income.monthlyAmount, '');

  // Calculate length of stay in days and months
  const lengthOfStayDays = trip?.startDate && trip?.endDate
    ? Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const lengthOfStayMonths = lengthOfStayDays
    ? Math.ceil(lengthOfStayDays / 30.44) // Average number of days in a month
    : null;

  // TODO: get these from the listing
  const shortestLeaseLength = 1;
  const shortestLeasePrice = currListing?.shortestLeasePrice;
  const longestLeaseLength = 12;
  const longestLeasePrice = currListing?.longestLeasePrice;

  const calculatePrice = (stayLengthMonths: number) => {
    if (stayLengthMonths <= shortestLeaseLength || !longestLeaseLength || !shortestLeaseLength) {
      return shortestLeasePrice;
    }

    if (stayLengthMonths >= longestLeaseLength) {
      return longestLeasePrice;
    }

    const priceRange = longestLeasePrice - shortestLeasePrice;
    const lengthRange = longestLeaseLength - shortestLeaseLength;
    const pricePerMonth = priceRange / lengthRange;

    return shortestLeasePrice + (stayLengthMonths - shortestLeaseLength) * pricePerMonth;
  };

  const calculatedPrice = lengthOfStayMonths ? calculatePrice(lengthOfStayMonths) : null;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center font-bold ">Summary </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>{trip?.numAdults} Adults {trip?.numChildren} children {trip?.numPets} pets</div>
          <div>Move in: {trip?.startDate?.toLocaleDateString() || 'Flexible'}</div>
          <div>Move out: {trip?.endDate?.toLocaleDateString() || 'Flexible'}</div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>Avg rating: ⭐ 4.9 (mocked)</div>
          <div>Total Income: $ {totalMonthlyIncome}</div>

          <div>Income to Rent Ratio: {calculatedPrice ? `${(totalMonthlyIncome / calculatedPrice).toFixed(2)}:1` : 'N/A'}</div>
          <div>Length of stay: {lengthOfStayDays ? `${lengthOfStayDays} days` : 'Flexible'}
            {lengthOfStayMonths && ` (${lengthOfStayMonths} months)`}
          </div>
          {calculatedPrice && (
            <div>Calculated Price: ${calculatedPrice.toFixed(2)}/month</div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>Criminal history: 🚩(mocked) </div>
          <div>Evictions: 🚩🚩(mocked)</div>
          <div>Avg Credit: E (800-850 mocked)</div>
        </div>
        <div className="flex justify-between mb-6">
          <Button className="w-[48%] bg-primaryBrand/80 hover:bg-primaryBrand">Approve</Button>
          <Button className="w-[48%] bg-pinkBrand/80 hover:bg-pinkBrand">Disapprove</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationSummary;
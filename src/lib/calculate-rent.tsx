import { Listing, Trip, ListingMonthlyPricing } from "@prisma/client";

interface ListingWithPricing extends Listing {
  monthlyPricing: ListingMonthlyPricing[];
}

interface RentParams {
  listing: ListingWithPricing | null;
  trip: Trip;
}

export function calculateRent({ listing, trip, }: RentParams): number {
  if (!listing) {
    console.warn('calculateRent called with null listing');
    return 0;
  }
  
  const { startDate, endDate } = trip;
  const lengthOfStay = calculateLengthOfStay(startDate, endDate).months;

  // Find the monthly pricing for the exact number of months (using full months only)
  const monthlyPricing = listing.monthlyPricing?.find(pricing => pricing.months === lengthOfStay);
  
  if (monthlyPricing) {
    return monthlyPricing.price;
  }

  // If no price exists for this duration, return the error code
  return 77777;
}


export const calculateLengthOfStay = (startDate: Date, endDate: Date) => {

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate dates
  if (end <= start) {
    console.error('Invalid date range: end date must be after start date');
    return { months: 0, days: 0 };
  }

  let months = 0;
  let days = 0;
  const tempDate = new Date(start);
  let safetyCounter = 0;
  const MAX_ITERATIONS = 120; // 10 years worth of months as safety limit

  while (tempDate < end && safetyCounter < MAX_ITERATIONS) {
    const monthEnd = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);

    if (monthEnd > end) {
      const remainingDays = end.getDate() - tempDate.getDate() + 1;
      days += remainingDays;
      break;
    } else {
      months++;
      tempDate.setMonth(tempDate.getMonth() + 1);
      tempDate.setDate(1);
    }

    safetyCounter++;
  }

  if (safetyCounter >= MAX_ITERATIONS) {
    console.error('Length of stay calculation reached maximum iterations - possible infinite loop prevented');
  }

  return { months, days };
}

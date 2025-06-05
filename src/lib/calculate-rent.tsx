import { Listing, Trip } from "@prisma/client";
interface RentParams {
  listing: Listing | null;
  trip: Trip;
}

export function calculateRent({ listing, trip, }: RentParams): number {
  if (!listing) {
    console.warn('calculateRent called with null listing');
    return 0;
  }
  
  const { shortestLeaseLength, longestLeaseLength, shortestLeasePrice, longestLeasePrice } = listing;
  const { startDate, endDate } = trip;
  const lengthOfStay = calculateLengthOfStay(startDate, endDate).months;

  // Ensure lengthOfStay is within the allowed range
  const clampedStayLength = Math.max(
    shortestLeaseLength,
    Math.min(longestLeaseLength, lengthOfStay)
  );

  // If the stay length is exactly minimum or maximum, return the corresponding price
  if (clampedStayLength === shortestLeaseLength) return shortestLeasePrice;
  if (clampedStayLength === longestLeaseLength) return longestLeasePrice;

  // Calculate the price difference and length difference
  const priceDifference = longestLeasePrice - shortestLeasePrice;
  const lengthDifference = longestLeaseLength - shortestLeaseLength;

  // Calculate the price per month of additional stay
  const pricePerMonth = priceDifference / lengthDifference;

  // Calculate the additional months beyond the minimum stay
  const additionalMonths = clampedStayLength - shortestLeaseLength;

  // Calculate the final rent
  const calculatedRent = shortestLeasePrice + (pricePerMonth * additionalMonths);
  const roundedRent = Math.round(calculatedRent);

  return roundedRent;
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

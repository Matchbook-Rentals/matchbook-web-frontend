import { Listing, Trip } from "@prisma/client";
interface RentParams {
  listing: Listing;
  trip: Trip;
}

export function calculateRent({ listing, trip, }: RentParams): number {
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

  return Math.round(calculatedRent); // Round to nearest integer
}


export const calculateLengthOfStay = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let months = 0;
  let days = 0;
  const tempDate = new Date(start);

  while (tempDate < end) {
    const monthEnd = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    if (monthEnd > end) {
      days += end.getDate() - tempDate.getDate() + 1;
    } else {
      months++;
      tempDate.setMonth(tempDate.getMonth() + 1);
      tempDate.setDate(1);
    }
  }

  return { months, days };
}
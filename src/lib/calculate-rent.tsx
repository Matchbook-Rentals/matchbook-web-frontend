import { Listing, Trip, ListingMonthlyPricing } from "@prisma/client";

interface ListingWithPricing extends Listing {
  monthlyPricing: ListingMonthlyPricing[];
}

interface RentParams {
  listing: ListingWithPricing | null;
  trip: Trip;
  includeServiceFee?: boolean;
}

/**
 * Apply the Matchbook service fee to a price.
 * < 6 months: 3%, >= 6 months: 1.5%
 */
export function applyServiceFee(price: number, months: number): number {
  const rate = months >= 6 ? 1.015 : 1.03;
  return Math.round(price * rate);
}

export function calculateRent({ listing, trip, includeServiceFee = true }: RentParams): number {
  if (!listing) {
    console.warn('calculateRent called with null listing');
    return 0;
  }

  const { startDate, endDate } = trip;

  // Calculate length using full calendar months model (minimum 1 month)
  const lengthOfStay = calculateLengthOfStay(startDate, endDate);
  const lengthInMonths = Math.max(1, lengthOfStay.months);

  let basePrice: number;

  // 1. Try exact match first
  const exactMatch = listing.monthlyPricing?.find(pricing => pricing.months === lengthInMonths);
  if (exactMatch) {
    basePrice = exactMatch.price;
  }
  // 2. Find closest match from available monthly pricing
  else if (listing.monthlyPricing && listing.monthlyPricing.length > 0) {
    const closest = listing.monthlyPricing.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.months - lengthInMonths);
      const currDiff = Math.abs(curr.months - lengthInMonths);

      // If current is closer, use it
      if (currDiff < prevDiff) return curr;

      // If equally close, prefer shorter lease (safer for hosts)
      if (currDiff === prevDiff && curr.months < prev.months) return curr;

      return prev;
    });
    basePrice = closest.price;
  }
  // 3. Fallback to listing's lease prices
  else if (listing.shortestLeasePrice) {
    basePrice = listing.shortestLeasePrice;
  } else if (listing.longestLeasePrice) {
    basePrice = listing.longestLeasePrice;
  } else if (listing.price) {
    basePrice = listing.price;
  } else {
    // 4. Last resort - return 0 instead of error code
    console.warn('No pricing found for listing:', listing.id);
    return 0;
  }

  return includeServiceFee ? applyServiceFee(basePrice, lengthInMonths) : basePrice;
}


export const calculateLengthOfStay = (startDate: Date, endDate: Date) => {

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate dates
  if (end <= start) {
    console.error('Invalid date range: end date must be after start date');
    return { months: 0, days: 0 };
  }

  // Calculate total days first
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Convert to months, ensuring minimum of 1 month for stays >= 28 days
  const calculatedMonths = Math.round(totalDays / 30);
  const months = Math.max(calculatedMonths >= 1 ? calculatedMonths : 0, totalDays >= 28 ? 1 : 0);

  // Calculate remaining days after accounting for full months
  const remainingDays = totalDays - (months * 30);
  const days = Math.max(0, remainingDays);

  return { months, days };
}

export const getUtilitiesIncluded = (
  listing: ListingWithPricing | null,
  trip: Trip | null
): boolean => {
  if (!listing || !trip) {
    return false;
  }

  // Calculate length of stay in months
  const lengthOfStay = calculateLengthOfStay(trip.startDate, trip.endDate);

  // Find matching monthly pricing for this duration
  const monthlyPricing = listing.monthlyPricing?.find(
    pricing => pricing.months === lengthOfStay.months
  );

  // If we have an exact match, use that
  if (monthlyPricing?.utilitiesIncluded !== undefined) {
    return monthlyPricing.utilitiesIncluded;
  }

  // Fallback to closest available month (same logic as calculateRent)
  if (listing.monthlyPricing && listing.monthlyPricing.length > 0) {
    const closest = listing.monthlyPricing.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.months - lengthOfStay.months);
      const currDiff = Math.abs(curr.months - lengthOfStay.months);
      if (currDiff < prevDiff) return curr;
      if (currDiff === prevDiff && curr.months < prev.months) return curr;
      return prev;
    });
    return closest.utilitiesIncluded;
  }

  return false;
}

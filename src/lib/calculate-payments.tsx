import { Listing, Trip, ListingMonthlyPricing } from "@prisma/client";
import { calculateRent } from "./calculate-rent";

interface ListingWithPricing extends Listing {
  monthlyPricing: ListingMonthlyPricing[];
}

interface PaymentParams {
  listing: ListingWithPricing | null;
  trip: Trip;
  monthlyRentOverride?: number | null; // Optional override from match.monthlyRent
  petRentOverride?: number | null; // Optional override from match.petRent (preserved at lease approval)
  petDepositOverride?: number | null; // Optional override from match.petDeposit (preserved at lease approval)
}

export interface PaymentDetails {
  monthlyRent: number;
  monthlyPetRent: number;
  totalMonthlyRent: number;
  securityDeposit: number;
  petDeposit: number;
  totalDeposit: number;
  utilitiesIncluded: boolean;
}

export function calculatePayments({ listing, trip, monthlyRentOverride, petRentOverride, petDepositOverride }: PaymentParams): PaymentDetails {
  console.log('🔍 [calculatePayments] Starting calculation with:', {
    monthlyRentOverride,
    petRentOverride,
    petDepositOverride,
    'listing.monthlyRent': listing?.monthlyRent,
    'listing.petRent': listing?.petRent,
    'listing.petDeposit': listing?.petDeposit,
    'trip.numPets': trip.numPets
  });
  
  // Calculate base monthly rent and utilities inclusion
  let monthlyRent = 0;
  let utilitiesIncluded = false;
  
  // First try to use override if provided and valid (but not if it's the fallback value)
  if (monthlyRentOverride && monthlyRentOverride > 0 && monthlyRentOverride !== 77777) {
    monthlyRent = monthlyRentOverride;
    console.log('🔍 [calculatePayments] Using monthlyRentOverride:', monthlyRentOverride);
    // When using override, check if there's a matching monthly pricing for utilities info
    if (listing?.monthlyPricing) {
      const lengthOfStay = calculateLengthOfStay(trip.startDate, trip.endDate);
      const monthlyPricing = listing.monthlyPricing.find(pricing => pricing.months === lengthOfStay.months);
      utilitiesIncluded = monthlyPricing?.utilitiesIncluded ?? false;
    }
  } else if (listing) {
    console.log('🔍 [calculatePayments] monthlyRentOverride invalid (77777), trying calculateRent with listing');
    // Otherwise calculate from listing pricing
    const calculatedRent = calculateRent({ listing, trip });
    if (calculatedRent && calculatedRent !== 77777) {
      monthlyRent = calculatedRent;
      // Check if there's a matching monthly pricing for utilities info
      const lengthOfStay = calculateLengthOfStay(trip.startDate, trip.endDate);
      const monthlyPricing = listing.monthlyPricing?.find(pricing => pricing.months === lengthOfStay.months);
      utilitiesIncluded = monthlyPricing?.utilitiesIncluded ?? false;
    } else {
      console.log('🔍 [calculatePayments] calculateRent returned 77777, using ListingMonthlyPricing fallback');
      // If we get the fallback value, try to find a suitable price from monthlyPricing
      const lengthOfStayMonths = Math.ceil(
        (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      
      console.log('🔍 [calculatePayments] Fallback calculation:', {
        lengthOfStayMonths,
        'listing.monthlyPricing': listing.monthlyPricing?.map(p => ({ months: p.months, price: p.price })) || 'none'
      });
      
      if (listing.monthlyPricing && listing.monthlyPricing.length > 0) {
        // Try to find the closest pricing match
        let bestMatch = listing.monthlyPricing[0]; // Start with first option
        let bestDifference = Math.abs(bestMatch.months - lengthOfStayMonths);
        
        for (const pricing of listing.monthlyPricing) {
          const difference = Math.abs(pricing.months - lengthOfStayMonths);
          if (difference < bestDifference) {
            bestMatch = pricing;
            bestDifference = difference;
          }
        }
        
        monthlyRent = bestMatch.price;
        utilitiesIncluded = bestMatch.utilitiesIncluded;
        
        console.log('🔍 [calculatePayments] Using closest pricing match:', {
          targetMonths: lengthOfStayMonths,
          selectedMonths: bestMatch.months,
          price: bestMatch.price,
          difference: bestDifference
        });
      } else {
        console.log('❌ [calculatePayments] No monthly pricing available - rent will be 0');
        monthlyRent = 0;
        utilitiesIncluded = false;
      }
    }
  }
  
  // Calculate pet rent (monthly charge per pet)
  // Use override from match if available (preserved at lease approval), otherwise use listing's current value
  const petRentPerPet = petRentOverride !== null && petRentOverride !== undefined
    ? petRentOverride
    : (listing?.petRent || 0);
  
  console.log('🔍 [calculatePayments] Pet rent calculation:', {
    'trip.numPets': trip.numPets,
    petRentOverride,
    'listing?.petRent': listing?.petRent,
    petRentPerPet,
    'petRentPerPet * trip.numPets': petRentPerPet * trip.numPets
  });
  
  const monthlyPetRent = trip.numPets > 0 
    ? petRentPerPet * trip.numPets 
    : 0;
  
  // Get deposits
  const securityDeposit = listing?.depositSize || monthlyRent; // Default to one month's rent if not specified
  
  // Calculate pet deposit
  // Use override from match if available (preserved at lease approval), otherwise use listing's current value
  const petDepositPerPet = petDepositOverride !== null && petDepositOverride !== undefined
    ? petDepositOverride
    : (listing?.petDeposit || 0);
    
  const petDeposit = trip.numPets > 0 
    ? petDepositPerPet * trip.numPets 
    : 0;
  
  const result = {
    monthlyRent,
    monthlyPetRent,
    totalMonthlyRent: monthlyRent + monthlyPetRent,
    securityDeposit,
    petDeposit,
    totalDeposit: securityDeposit + petDeposit,
    utilitiesIncluded,
  };
  
  console.log('🔍 [calculatePayments] Final result:', result);
  
  return result;
}

// Helper function to calculate length of stay (copied from calculate-rent.tsx to avoid circular dependency)
function calculateLengthOfStay(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return { months: 0, days: 0 };
  }

  let months = 0;
  let days = 0;
  const tempDate = new Date(start);
  let safetyCounter = 0;
  const MAX_ITERATIONS = 120;

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

  return { months, days };
}
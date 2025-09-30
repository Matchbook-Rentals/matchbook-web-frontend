/**
 * Payment Calculations Module
 *
 * Centralized, clean functions for all payment-related calculations.
 * All functions are pure and easily testable.
 *
 * Categories:
 * - Deposits (security, pet)
 * - Rent (monthly, pet rent, proration)
 * - Fees (service, transfer, credit card)
 * - Totals and schedules
 *
 * For complete payment specification, see /docs/payment-spec.md
 */

import { FEES } from './fee-constants';

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentBreakdown {
  // Deposits
  securityDeposit: number;
  petDeposit: number;
  totalDeposits: number;

  // Rent
  monthlyRent: number;
  monthlyPetRent: number;
  totalMonthlyRent: number;

  // Fees
  transferFee: number;
  serviceFee: number;
  creditCardFee: number;

  // Totals
  subtotal: number;
  totalDueToday: number;
}

export interface ProratedRentDetails {
  amount: number;
  daysInMonth: number;
  daysToCharge: number;
  dailyRate: number;
  isProrated: boolean;
}

export interface PaymentScheduleItem {
  amount: number;
  dueDate: Date;
  description: string;
  isProrated?: boolean;
  breakdown?: {
    rent: number;
    petRent: number;
    serviceFee: number;
  };
}

export interface TripDetails {
  startDate: Date;
  endDate: Date;
  petCount?: number;
}

export interface ListingPricing {
  monthlyRent: number;
  securityDeposit: number;
  petRent?: number;
  petDeposit?: number;
}

// ============================================================================
// DEPOSIT CALCULATIONS
// ============================================================================

/**
 * Calculate security deposit amount
 * @param monthlyRent - Monthly rent amount
 * @param customDeposit - Optional custom deposit amount
 * @returns Security deposit amount
 */
export function calculateSecurityDeposit(
  monthlyRent: number,
  customDeposit?: number
): number {
  // If custom deposit is provided, use it; otherwise default to one month's rent
  return customDeposit ?? monthlyRent;
}

/**
 * Calculate pet deposit amount
 * @param petCount - Number of pets
 * @param petDepositPerPet - Deposit amount per pet
 * @returns Total pet deposit
 */
export function calculatePetDeposit(
  petCount: number,
  petDepositPerPet: number = 0
): number {
  if (petCount <= 0 || petDepositPerPet <= 0) return 0;
  return petCount * petDepositPerPet;
}

/**
 * Calculate total deposits
 * @param securityDeposit - Security deposit amount
 * @param petDeposit - Pet deposit amount
 * @returns Total deposit amount
 */
export function calculateTotalDeposits(
  securityDeposit: number,
  petDeposit: number = 0
): number {
  return securityDeposit + petDeposit;
}

// ============================================================================
// RENT CALCULATIONS
// ============================================================================

/**
 * Calculate monthly pet rent
 * @param petCount - Number of pets
 * @param petRentPerPet - Monthly rent per pet
 * @returns Total monthly pet rent
 */
export function calculateMonthlyPetRent(
  petCount: number,
  petRentPerPet: number = 0
): number {
  if (petCount <= 0 || petRentPerPet <= 0) return 0;
  return petCount * petRentPerPet;
}

/**
 * Calculate total monthly rent (base + pet)
 * @param baseRent - Base monthly rent
 * @param petRent - Monthly pet rent
 * @returns Total monthly rent
 */
export function calculateTotalMonthlyRent(
  baseRent: number,
  petRent: number = 0
): number {
  return baseRent + petRent;
}

/**
 * Calculate prorated rent for partial month
 * @param monthlyRent - Full monthly rent amount
 * @param startDate - Move-in date (or start of month for last month proration)
 * @param endDate - Optional end date for the month (move-out date for last month)
 * @returns Prorated rent details
 */
export function calculateProratedRent(
  monthlyRent: number,
  startDate: Date,
  endDate?: Date
): ProratedRentDetails {
  const start = new Date(startDate);
  // Use standard date methods (will be in listing's timezone)
  const startDay = start.getDate();
  const startMonth = start.getMonth();
  const startYear = start.getFullYear();
  
  console.log('🧑 [calculateProratedRent] Input:', {
    monthlyRent,
    startDate: start.toISOString(),
    startDay,
    startMonth: startMonth + 1,
    startYear,
    endDate: endDate?.toISOString() || 'none (will use end of month)'
  });
  
  // Get the last day of the start month
  const lastDayOfMonth = new Date(startYear, startMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  console.log('📅 Month details:', {
    lastDayOfMonth: lastDayOfMonth.toISOString(),
    daysInMonth
  });
  
  // Determine the effective end date
  const effectiveEndDate = endDate || lastDayOfMonth;
  const effectiveEndDay = effectiveEndDate.getDate();
  
  // Check if this is a last month proration (starting on 1st with end date before month end)
  const isLastMonthProration = startDay === 1 && endDate && effectiveEndDay < daysInMonth;
  
  // If starting on the 1st and no end date specified (or end date is last day), no proration needed
  if (startDay === 1 && (!endDate || effectiveEndDay === daysInMonth)) {
    console.log('✅ Full month - NO PRORATION NEEDED');
    return {
      amount: monthlyRent,
      daysInMonth,
      daysToCharge: daysInMonth,
      dailyRate: monthlyRent / daysInMonth,
      isProrated: false
    };
  }
  
  // Calculate days to charge
  let daysToCharge: number;
  
  if (isLastMonthProration) {
    // For last month: charge from day 1 through the end day
    daysToCharge = effectiveEndDay;
    console.log('📅 Last month proration: charging for days 1 through', effectiveEndDay);
  } else {
    // For first month: charge from start day through end of month
    daysToCharge = Math.min(
      effectiveEndDay - startDay + 1,
      daysInMonth - startDay + 1
    );
    console.log('📅 First month proration: charging from day', startDay, 'onwards');
  }
  
  console.log('🎯 Effective end date:', effectiveEndDate.toISOString());
  console.log('🧑 Calculation:', {
    'effectiveEndDay': effectiveEndDay,
    'startDay': startDay,
    'daysToCharge': daysToCharge,
    'isLastMonthProration': isLastMonthProration
  });
  
  const dailyRate = monthlyRent / daysInMonth;
  const proratedAmount = Math.round(dailyRate * daysToCharge * 100) / 100;
  
  console.log('💵 PRORATION RESULT:', {
    daysToCharge,
    dailyRate,
    proratedAmount,
    'calculation': `$${monthlyRent} / ${daysInMonth} days * ${daysToCharge} days = $${proratedAmount}`
  });
  
  return {
    amount: proratedAmount,
    daysInMonth,
    daysToCharge,
    dailyRate,
    isProrated: true
  };
}

/**
 * Calculate trip duration in months
 * @param startDate - Trip start date
 * @param endDate - Trip end date
 * @returns Number of months (rounded up)
 */
export function calculateTripMonths(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 30);
}

// ============================================================================
// FEE CALCULATIONS
// ============================================================================

/**
 * Get deposit transfer fee amount (flat fee for deposits)
 * @returns Transfer fee amount
 */
export function getTransferFee(): number {
  return FEES.TRANSFER_FEE_DOLLARS;
}

/**
 * Calculate service fee for rent payments
 * @param rentAmount - Monthly rent amount
 * @param tripMonths - Duration of trip in months
 * @returns Service fee amount
 */
export function calculateServiceFee(
  rentAmount: number,
  tripMonths: number
): number {
  const rate = tripMonths > FEES.SERVICE_FEE.THRESHOLD_MONTHS
    ? FEES.SERVICE_FEE.LONG_TERM_RATE
    : FEES.SERVICE_FEE.SHORT_TERM_RATE;
  
  return Math.round(rentAmount * rate * 100) / 100;
}

/**
 * Calculate credit card processing fee
 * Uses 3% self-inclusive formula to ensure we receive the intended amount
 * @param baseAmount - Amount we want to receive after fees
 * @returns Credit card fee amount
 */
export function calculateCreditCardFee(baseAmount: number): number {
  // Formula: totalAmount = baseAmount / (1 - 0.03)
  const totalWithFee = baseAmount / (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE);
  // The fee is the difference
  return Math.round((totalWithFee - baseAmount) * 100) / 100;
}

/**
 * Calculate total amount including credit card fee
 * @param baseAmount - Amount before credit card fee
 * @returns Total amount to charge
 */
export function calculateTotalWithCreditCardFee(baseAmount: number): number {
  return baseAmount + calculateCreditCardFee(baseAmount);
}

/**
 * Convert dollars to cents (for Stripe)
 * Ensures proper integer conversion without floating point errors
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToStripeAmount(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export function stripAmountToDollars(cents: number): number {
  return cents / 100;
}

// ============================================================================
// TOTAL CALCULATIONS
// ============================================================================

/**
 * Calculate total amount due today (for initial payment)
 * @param deposits - Total deposit amount
 * @param transferFee - Transfer fee amount
 * @param isUsingCard - Whether payment is via credit card
 * @returns Total amount due today
 */
export function calculateTotalDueToday(
  deposits: number,
  transferFee: number,
  isUsingCard: boolean = false
): number {
  const subtotal = deposits + transferFee;
  
  if (isUsingCard) {
    return calculateTotalWithCreditCardFee(subtotal);
  }
  
  return subtotal;
}

/**
 * Calculate complete payment breakdown
 * @param listing - Listing pricing details
 * @param trip - Trip details
 * @param isUsingCard - Whether payment is via credit card
 * @returns Complete payment breakdown
 */
export function calculatePaymentBreakdown(
  listing: ListingPricing,
  trip: TripDetails,
  isUsingCard: boolean = false
): PaymentBreakdown {
  // Calculate deposits
  const securityDeposit = calculateSecurityDeposit(
    listing.monthlyRent,
    listing.securityDeposit
  );
  
  const petDeposit = calculatePetDeposit(
    trip.petCount || 0,
    listing.petDeposit || 0
  );
  
  const totalDeposits = calculateTotalDeposits(securityDeposit, petDeposit);
  
  // Calculate rent
  const monthlyPetRent = calculateMonthlyPetRent(
    trip.petCount || 0,
    listing.petRent || 0
  );
  
  const totalMonthlyRent = calculateTotalMonthlyRent(
    listing.monthlyRent,
    monthlyPetRent
  );
  
  // Calculate fees
  const transferFee = getTransferFee();
  const tripMonths = calculateTripMonths(trip.startDate, trip.endDate);
  const serviceFee = calculateServiceFee(totalMonthlyRent, tripMonths);
  
  // Calculate subtotal (deposits + deposit transfer fee)
  const subtotal = totalDeposits + transferFee;
  
  // Calculate credit card fee if applicable
  const creditCardFee = isUsingCard ? calculateCreditCardFee(subtotal) : 0;
  
  // Calculate total due today
  const totalDueToday = subtotal + creditCardFee;
  
  return {
    // Deposits
    securityDeposit,
    petDeposit,
    totalDeposits,
    
    // Rent
    monthlyRent: listing.monthlyRent,
    monthlyPetRent,
    totalMonthlyRent,
    
    // Fees
    transferFee,
    serviceFee,
    creditCardFee,
    
    // Totals
    subtotal,
    totalDueToday
  };
}

// ============================================================================
// PAYMENT SCHEDULE
// ============================================================================

/**
 * Generate complete payment schedule for a trip
 * @param trip - Trip details
 * @param monthlyRent - Base monthly rent
 * @param monthlyPetRent - Monthly pet rent
 * @param includeServiceFee - Whether to include service fees
 * @returns Array of payment schedule items
 */
export function generatePaymentSchedule(
  trip: TripDetails,
  monthlyRent: number,
  monthlyPetRent: number = 0,
  includeServiceFee: boolean = true
): PaymentScheduleItem[] {
  const payments: PaymentScheduleItem[] = [];
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  
  const totalMonthlyRent = monthlyRent + monthlyPetRent;
  const tripMonths = calculateTripMonths(start, end);
  const serviceFeeRate = includeServiceFee
    ? (tripMonths > FEES.SERVICE_FEE.THRESHOLD_MONTHS
        ? FEES.SERVICE_FEE.LONG_TERM_RATE
        : FEES.SERVICE_FEE.SHORT_TERM_RATE)
    : 0;
  
  // First month (potentially prorated)
  const firstMonthProration = calculateProratedRent(totalMonthlyRent, start);
  const firstMonthServiceFee = Math.round(firstMonthProration.amount * serviceFeeRate * 100) / 100;
  
  payments.push({
    amount: firstMonthProration.amount + firstMonthServiceFee,
    dueDate: start,
    description: firstMonthProration.isProrated
      ? `First month rent (${firstMonthProration.daysToCharge} days, prorated)`
      : 'First month rent',
    isProrated: firstMonthProration.isProrated,
    breakdown: {
      rent: monthlyRent * (firstMonthProration.daysToCharge / firstMonthProration.daysInMonth),
      petRent: monthlyPetRent * (firstMonthProration.daysToCharge / firstMonthProration.daysInMonth),
      serviceFee: firstMonthServiceFee
    }
  });
  
  // Subsequent months
  let currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  
  while (currentDate <= end) {
    const monthName = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Check if this is a partial last month
    const isLastMonth = currentDate.getMonth() === end.getMonth() && 
                       currentDate.getFullYear() === end.getFullYear();
    
    let rentAmount = totalMonthlyRent;
    let description = `${monthName} rent`;
    let isProrated = false;
    
    if (isLastMonth && end.getDate() < new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()) {
      // Prorate last month if it's partial
      const lastMonthProration = calculateProratedRent(
        totalMonthlyRent,
        currentDate,
        end
      );
      rentAmount = lastMonthProration.amount;
      description = `${monthName} rent (${lastMonthProration.daysToCharge} days, prorated)`;
      isProrated = true;
    }
    
    const monthServiceFee = Math.round(rentAmount * serviceFeeRate * 100) / 100;
    
    payments.push({
      amount: rentAmount + monthServiceFee,
      dueDate: currentDate,
      description,
      isProrated,
      breakdown: {
        rent: monthlyRent * (rentAmount / totalMonthlyRent),
        petRent: monthlyPetRent * (rentAmount / totalMonthlyRent),
        serviceFee: monthServiceFee
      }
    });
    
    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }
  
  return payments;
}

/**
 * Format currency amount for display
 * @param amount - Amount in dollars
 * @param includeSign - Whether to include dollar sign
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, includeSign: boolean = true): string {
  const formatted = amount.toFixed(2);
  return includeSign ? `$${formatted}` : formatted;
}

/**
 * Calculate percentage of one amount relative to another
 * @param amount - The amount to calculate percentage of
 * @param total - The total amount
 * @returns Percentage (0-100)
 */
export function calculatePercentage(amount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((amount / total) * 10000) / 100;
}
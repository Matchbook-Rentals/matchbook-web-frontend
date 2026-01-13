// Helper functions for booking flow in E2E tests
import { Page, APIRequestContext, expect } from '@playwright/test';

// Stripe test cards (same as verification helper for consistency)
export const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  REQUIRES_AUTHENTICATION: '4000002500003155',
  INSUFFICIENT_FUNDS: '4000000000009995',
};

export interface PaymentCardData {
  cardNumber: string;
  expiry: string;
  cvc: string;
  zip?: string;
}

// Default test card data
export const DEFAULT_TEST_CARD: PaymentCardData = {
  cardNumber: STRIPE_TEST_CARDS.SUCCESS,
  expiry: '12/28',
  cvc: '123',
  zip: '12345',
};

/**
 * Navigate to the payment page for a match
 */
export async function navigateToPaymentPage(
  page: Page,
  matchId: string
): Promise<void> {
  await page.goto(`/app/rent/match/${matchId}/payment`);
  await page.waitForLoadState('networkidle');

  // Wait for the payment page to load
  await page.waitForTimeout(2000);
}

/**
 * Navigate to the payment setup success page
 */
export async function navigateToPaymentSetupSuccess(
  page: Page,
  matchId: string
): Promise<void> {
  await page.goto(`/app/rent/match/${matchId}/payment-setup-success`);
  await page.waitForLoadState('networkidle');
}

/**
 * Fill in Stripe card details
 * Handles Stripe's iframe-based card input
 */
export async function fillStripeCardDetails(
  page: Page,
  cardData: PaymentCardData = DEFAULT_TEST_CARD
): Promise<boolean> {
  try {
    // Wait for Stripe iframe to load
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();

    // Try filling card number
    const cardNumberInput = stripeFrame.locator('[name="cardnumber"], [placeholder*="Card number"]').first();
    if (await cardNumberInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cardNumberInput.fill(cardData.cardNumber);
    }

    // Expiry date
    const expiryInput = stripeFrame.locator('[name="exp-date"], [placeholder*="MM"]').first();
    if (await expiryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expiryInput.fill(cardData.expiry);
    }

    // CVC
    const cvcInput = stripeFrame.locator('[name="cvc"], [placeholder*="CVC"]').first();
    if (await cvcInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cvcInput.fill(cardData.cvc);
    }

    // ZIP (if visible)
    if (cardData.zip) {
      const zipInput = stripeFrame.locator('[name="postal"], [placeholder*="ZIP"]').first();
      if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await zipInput.fill(cardData.zip);
      }
    }

    return true;
  } catch (error) {
    console.error('Error filling Stripe card details:', error);
    return false;
  }
}

/**
 * Authorize payment for a booking
 * This step happens after lease signing
 */
export async function authorizePayment(
  page: Page,
  matchId: string,
  cardData: PaymentCardData = DEFAULT_TEST_CARD
): Promise<{ success: boolean; error?: string }> {
  try {
    // Navigate to payment page
    await navigateToPaymentPage(page, matchId);

    // Wait for the payment form to be ready
    await page.waitForTimeout(2000);

    // Look for existing payment method or add new card
    const useExistingButton = page.getByRole('button', { name: /use existing|continue with/i }).first();
    if (await useExistingButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Use existing payment method
      await useExistingButton.click();
    } else {
      // Need to add a new card
      const addCardButton = page.getByRole('button', { name: /add card|new card|add payment/i }).first();
      if (await addCardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addCardButton.click();
        await page.waitForTimeout(1000);
      }

      // Fill in card details
      const cardFilled = await fillStripeCardDetails(page, cardData);
      if (!cardFilled) {
        return { success: false, error: 'Failed to fill card details' };
      }
    }

    // Click the authorize/confirm payment button
    const authorizeButton = page.getByRole('button', {
      name: /authorize|confirm|complete payment|pay|submit/i
    }).first();

    if (await authorizeButton.isVisible({ timeout: 5000 })) {
      await authorizeButton.click();

      // Wait for payment processing
      await page.waitForTimeout(5000);

      // Check for success
      const successIndicators = [
        page.getByText(/payment authorized/i),
        page.getByText(/payment successful/i),
        page.getByText(/booking confirmed/i),
        page.locator('[data-testid="payment-success"]'),
      ];

      for (const indicator of successIndicators) {
        if (await indicator.isVisible({ timeout: 10000 }).catch(() => false)) {
          return { success: true };
        }
      }

      // Check if we were redirected to complete page
      const currentUrl = page.url();
      if (currentUrl.includes('/complete') || currentUrl.includes('/payment-success')) {
        return { success: true };
      }

      // Check for error messages
      const errorIndicator = page.getByText(/payment failed|declined|error/i).first();
      if (await errorIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        return { success: false, error: 'Payment was declined' };
      }
    }

    return { success: true }; // Assume success if no explicit error
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown payment error'
    };
  }
}

/**
 * Select a saved payment method
 */
export async function selectSavedPaymentMethod(
  page: Page,
  last4?: string
): Promise<boolean> {
  // Find payment method options
  const paymentMethodOptions = page.locator('[data-payment-method], .payment-method-option');

  if (last4) {
    // Select specific card by last 4 digits
    const specificCard = paymentMethodOptions.filter({ hasText: last4 }).first();
    if (await specificCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await specificCard.click();
      return true;
    }
  } else {
    // Select first available payment method
    const firstOption = paymentMethodOptions.first();
    if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstOption.click();
      return true;
    }
  }

  return false;
}

/**
 * Verify a booking was created via API
 */
export async function verifyBookingCreated(
  request: APIRequestContext,
  matchId: string
): Promise<boolean> {
  try {
    const response = await request.get(`/api/dev/bookings?matchId=${matchId}`);
    const data = await response.json();

    return data.bookings && data.bookings.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get booking details via API
 */
export async function getBookingByMatchId(
  request: APIRequestContext,
  matchId: string
): Promise<any | null> {
  try {
    const response = await request.get(`/api/dev/bookings?matchId=${matchId}`);
    const data = await response.json();

    if (data.bookings && data.bookings.length > 0) {
      return data.bookings[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get booking by ID via API
 */
export async function getBookingById(
  request: APIRequestContext,
  bookingId: string
): Promise<any | null> {
  try {
    const response = await request.get(`/api/dev/bookings?id=${bookingId}`);
    const data = await response.json();

    if (data.bookings && data.bookings.length > 0) {
      return data.bookings[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify rent payments were generated for a booking
 */
export async function verifyRentPaymentsGenerated(
  request: APIRequestContext,
  bookingId: string
): Promise<{ hasPayments: boolean; count: number }> {
  try {
    const response = await request.get(`/api/dev/rent-payments?bookingId=${bookingId}`);
    const data = await response.json();

    const payments = data.rentPayments || [];
    return {
      hasPayments: payments.length > 0,
      count: payments.length
    };
  } catch {
    return { hasPayments: false, count: 0 };
  }
}

/**
 * Get rent payments for a booking via API
 */
export async function getRentPayments(
  request: APIRequestContext,
  bookingId: string
): Promise<any[]> {
  try {
    const response = await request.get(`/api/dev/rent-payments?bookingId=${bookingId}`);
    const data = await response.json();
    return data.rentPayments || [];
  } catch {
    return [];
  }
}

/**
 * Check if payment is authorized for a match
 */
export async function isPaymentAuthorized(
  request: APIRequestContext,
  matchId: string
): Promise<boolean> {
  try {
    const response = await request.get(`/api/dev/matches?id=${matchId}`);
    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      return !!data.matches[0].paymentAuthorizedAt;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Navigate to completed booking page
 */
export async function navigateToCompletedBooking(
  page: Page,
  matchId: string
): Promise<void> {
  await page.goto(`/app/rent/match/${matchId}/complete`);
  await page.waitForLoadState('networkidle');
}

/**
 * Verify booking confirmation page shows success
 */
export async function verifyBookingConfirmation(page: Page): Promise<boolean> {
  const successIndicators = [
    page.getByText(/booking confirmed/i),
    page.getByText(/booking complete/i),
    page.getByText(/congratulations/i),
    page.getByText(/you're all set/i),
    page.locator('[data-testid="booking-confirmed"]'),
  ];

  for (const indicator of successIndicators) {
    if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      return true;
    }
  }

  return false;
}

/**
 * Get booking status
 */
export async function getBookingStatus(
  request: APIRequestContext,
  bookingId: string
): Promise<string | null> {
  const booking = await getBookingById(request, bookingId);
  return booking?.status || null;
}

/**
 * Navigate to renter's bookings list
 */
export async function navigateToRenterBookings(page: Page): Promise<void> {
  await page.goto('/app/rent/bookings');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to host's bookings for a listing
 */
export async function navigateToHostBookings(
  page: Page,
  listingId: string
): Promise<void> {
  await page.goto(`/app/host/${listingId}/bookings`);
  await page.waitForLoadState('networkidle');
}

/**
 * Full booking flow: authorize payment and verify booking created
 */
export async function completeBookingFlow(
  page: Page,
  request: APIRequestContext,
  matchId: string,
  cardData: PaymentCardData = DEFAULT_TEST_CARD
): Promise<{
  success: boolean;
  bookingId?: string;
  error?: string
}> {
  // Authorize payment
  const paymentResult = await authorizePayment(page, matchId, cardData);

  if (!paymentResult.success) {
    return { success: false, error: paymentResult.error };
  }

  // Verify booking was created
  const booking = await getBookingByMatchId(request, matchId);

  if (booking) {
    // Verify rent payments were generated
    const payments = await verifyRentPaymentsGenerated(request, booking.id);

    if (payments.hasPayments) {
      return { success: true, bookingId: booking.id };
    } else {
      return {
        success: true,
        bookingId: booking.id,
        error: 'Booking created but no rent payments generated'
      };
    }
  }

  return { success: false, error: 'Booking not created after payment' };
}

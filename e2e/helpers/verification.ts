// Helper functions for verification flow e2e tests
import { Page, expect } from '@playwright/test';

export interface VerificationFormData {
  firstName: string;
  lastName: string;
  ssn: string;
  dob: string; // YYYY-MM-DD format
  address: string;
  city: string;
  state: string;
  zip: string;
}

// Test data for different scenarios
export const TEST_USERS = {
  GOOD_CREDIT: {
    firstName: 'Steve',
    lastName: 'Johnson',
    ssn: '111111111',
    dob: '1980-08-15',
    address: '3557 Lancer Way',
    city: 'Carlsbad',
    state: 'CA',
    zip: '92008',
  },
  FAIR_CREDIT: {
    firstName: 'John',
    lastName: 'Dough',
    ssn: '222222222',
    dob: '1982-04-15',
    address: '310 Tamarack Ave',
    city: 'Carlsbad',
    state: 'CA',
    zip: '92010',
  },
  INVALID_SSN: {
    firstName: 'Invalid',
    lastName: 'SSN',
    ssn: '000000000',
    dob: '1985-01-01',
    address: '123 Test St',
    city: 'Carlsbad',
    state: 'CA',
    zip: '92008',
  },
  NO_CREDIT_FILE: {
    firstName: 'Jeff',
    lastName: 'Nascore',
    ssn: '555555555',
    dob: '1979-10-15',
    address: '1999 California St',
    city: 'Carlsbad',
    state: 'CA',
    zip: '92054',
  },
};

// Stripe test cards
export const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
};

/**
 * Reset verification status for the current user via dev API
 */
export async function resetVerificationStatus(page: Page): Promise<void> {
  const response = await page.request.post('/api/dev/reset-verifications');
  if (!response.ok()) {
    console.warn('Failed to reset verification status:', await response.text());
  }
}

/**
 * Fill the verification personal info form
 */
export async function fillVerificationForm(page: Page, data: VerificationFormData): Promise<void> {
  // Fill first name
  await page.getByPlaceholder('Enter First Name').fill(data.firstName);

  // Fill last name
  await page.getByPlaceholder('Enter Last Name').fill(data.lastName);

  // Fill SSN (format: XXX-XX-XXXX, input accepts raw digits)
  await page.getByPlaceholder('123-45-6789').fill(data.ssn);

  // Fill DOB using the date picker
  // The DateOfBirthPicker is a custom component, we need to click it and fill
  const dobPicker = page.getByPlaceholder('MM/DD/YYYY');
  await dobPicker.click();
  // Parse the date and fill in the format expected by the picker
  const [year, month, day] = data.dob.split('-');
  // Type the date directly - the picker accepts typed input
  await dobPicker.fill(`${month}/${day}/${year}`);
  // Press escape to close any picker dropdown
  await page.keyboard.press('Escape');

  // Fill address
  await page.getByPlaceholder('Enter Street Address').fill(data.address);

  // Fill city
  await page.getByPlaceholder('Enter City').fill(data.city);

  // Select state from dropdown
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: getStateName(data.state) }).click();

  // Fill zip code
  await page.getByPlaceholder('Enter Zip Code').fill(data.zip);
}

/**
 * Click the Continue button in the verification footer
 */
export async function clickContinue(page: Page): Promise<void> {
  await page.getByTestId('verification-primary-button').click();
}

/**
 * Click the Back button in the verification footer
 */
export async function clickBack(page: Page): Promise<void> {
  await page.getByTestId('verification-secondary-button').click();
}

/**
 * Accept background check authorization (check the checkbox and continue)
 */
export async function acceptBackgroundAuth(page: Page): Promise<void> {
  // Wait for the background auth step
  await expect(page.getByTestId('verification-step-background-auth')).toBeVisible();

  // Check the authorization checkbox
  await page.getByTestId('backgroundCheckAuthorization-checkbox').check();

  // Click continue
  await clickContinue(page);
}

/**
 * Accept credit check authorization (check the checkbox and continue)
 */
export async function acceptCreditAuth(page: Page): Promise<void> {
  // Wait for the credit auth step
  await expect(page.getByTestId('verification-step-credit-auth')).toBeVisible();

  // Check the authorization checkbox
  await page.getByTestId('creditAuthorizationAcknowledgment-checkbox').check();

  // Click continue
  await clickContinue(page);
}

/**
 * Select a test client from the dev modal
 */
export async function selectTestClient(page: Page, ssn: string): Promise<void> {
  // Click the Skip (Dev) button to open the modal
  await page.getByTestId('verification-secondary-button').click();

  // Wait for modal to appear
  await expect(page.getByTestId('test-client-modal')).toBeVisible();

  // Click the test client button
  await page.getByTestId(`test-client-${ssn}`).click();
}

/**
 * Select a saved payment method or fill new Stripe card details
 * Returns true if a saved card was selected, false if new card form was filled
 */
export async function selectOrFillPaymentMethod(
  page: Page,
  cardNumber: string = STRIPE_TEST_CARDS.SUCCESS,
  expiry: string = '12/30',
  cvc: string = '123'
): Promise<boolean> {
  // First check if there are saved payment methods
  const savedCardSelector = page.locator('text=/Visa|Mastercard|Amex|Discover/i').first();
  const hasSavedCard = await savedCardSelector.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasSavedCard) {
    // Click on the first saved card to select it
    await savedCardSelector.click();
    console.log('Selected existing saved card');
    return true;
  }

  // No saved cards - need to fill the Stripe form
  // First click "Add New Payment Method" if visible
  const addNewButton = page.getByText('Add New Payment Method');
  if (await addNewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addNewButton.click();
    // Wait for Stripe form to load
    await page.waitForTimeout(2000);
  }

  // Fill Stripe card details in the iframe
  await fillStripeCard(page, cardNumber, expiry, cvc);

  // Click "Save Card" button to save the payment method
  const saveCardButton = page.getByRole('button', { name: /save card/i });
  if (await saveCardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await saveCardButton.click();
    console.log('Clicked Save Card button');
    // Wait for card to be saved (button may change or form may close)
    await page.waitForTimeout(3000);
  }

  return false;
}

/**
 * Fill card details in the payment form (when adding new card)
 * Handles both custom card form and Stripe iframe
 */
export async function fillStripeCard(
  page: Page,
  cardNumber: string = STRIPE_TEST_CARDS.SUCCESS,
  expiry: string = '12/30',
  cvc: string = '123'
): Promise<void> {
  // Check if it's the custom card form (not Stripe iframe)
  const customCardInput = page.getByPlaceholder('1234 1234 1234 1234');
  const isCustomForm = await customCardInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (isCustomForm) {
    // Fill custom card form
    await customCardInput.fill(cardNumber);
    await page.getByPlaceholder('MM / YY').fill(expiry);
    await page.getByPlaceholder('CVC').fill(cvc);
    return;
  }

  // Fall back to Stripe iframe
  await page.waitForSelector('iframe[name*="__privateStripeFrame"]', { timeout: 10000 });
  const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();

  // Stripe inputs use accessible names, not placeholder attributes
  await stripeFrame.getByRole('textbox', { name: 'Card number' }).fill(cardNumber);
  await stripeFrame.getByRole('textbox', { name: /expiration/i }).fill(expiry);
  await stripeFrame.getByRole('textbox', { name: /security code/i }).fill(cvc);

  // Also need to fill ZIP code for Stripe
  await stripeFrame.getByRole('textbox', { name: 'ZIP code' }).fill('92008');
}

/**
 * Wait for verification to complete successfully
 */
export async function waitForVerificationComplete(page: Page): Promise<void> {
  // Wait for completion indicators - either the complete screen or redirect to list
  // Use specific heading to avoid matching multiple elements
  await expect(
    page.getByRole('heading', { name: /Verification Complete/i }).first()
  ).toBeVisible({ timeout: 60000 });
}

/**
 * Wait for SSN error screen
 */
export async function waitForSsnError(page: Page): Promise<void> {
  await expect(page.getByTestId('processing-screen-ssn-error')).toBeVisible({ timeout: 30000 });
}

/**
 * Wait for no credit file error screen
 */
export async function waitForNoCreditFileError(page: Page): Promise<void> {
  await expect(page.getByTestId('processing-screen-no-credit-file')).toBeVisible({ timeout: 30000 });
}

/**
 * Wait for refund success screen
 */
export async function waitForRefundSuccess(page: Page): Promise<void> {
  await expect(page.getByTestId('processing-screen-refund-success')).toBeVisible({ timeout: 30000 });
}

/**
 * Wait for verification failed screen (after second failure)
 */
export async function waitForVerificationFailed(page: Page): Promise<void> {
  await expect(page.getByTestId('processing-screen-verification-failed')).toBeVisible({ timeout: 30000 });
}

/**
 * Set up route interception to capture paymentIntentId
 * Returns a promise that resolves with the paymentIntentId when payment is created
 */
export async function capturePaymentIntentId(page: Page): Promise<() => Promise<string | null>> {
  let paymentIntentId: string | null = null;

  await page.route('**/api/verification/charge-payment-method', async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    paymentIntentId = json.paymentIntentId || null;
    console.log('Captured paymentIntentId:', paymentIntentId);
    await route.fulfill({ response, json });
  });

  // Return a function to get the captured ID
  return async () => paymentIntentId;
}

/**
 * Verify the Stripe payment status via dev API
 */
export async function verifyPaymentStatus(
  page: Page,
  paymentIntentId: string,
  expectedStatus: 'requires_capture' | 'succeeded' | 'canceled'
): Promise<void> {
  const response = await page.request.get(`/api/dev/payment-status?paymentIntentId=${paymentIntentId}`);
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  console.log(`Payment ${paymentIntentId} status: ${data.status} (expected: ${expectedStatus})`);
  expect(data.status).toBe(expectedStatus);
}

/**
 * Helper to convert state code to full name
 */
function getStateName(stateCode: string): string {
  const states: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
  };
  return states[stateCode] || stateCode;
}

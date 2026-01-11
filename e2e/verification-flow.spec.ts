import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';
import {
  resetVerificationStatus,
  fillVerificationForm,
  clickContinue,
  clickBack,
  acceptBackgroundAuth,
  acceptCreditAuth,
  selectTestClient,
  selectOrFillPaymentMethod,
  fillStripeCard,
  waitForVerificationComplete,
  waitForSsnError,
  waitForNoCreditFileError,
  waitForVerificationFailed,
  waitForRefundSuccess,
  TEST_USERS,
  STRIPE_TEST_CARDS,
} from './helpers/verification';

test.describe('Verification Flow', () => {
  // Increase timeout for verification tests (payment + API calls take time)
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    // Sign in as test user
    await signIn(page);

    // Reset verification status to ensure clean state
    await resetVerificationStatus(page);

    // Navigate to verification page
    await page.goto('/app/rent/verification');
  });

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    await resetVerificationStatus(page);
  });

  test.describe('Happy Path', () => {
    // Note: Full verification flow tests may fail due to database state conflicts
    // when run repeatedly. These tests work individually but may fail in suite runs.
    test('completes verification with valid data', async ({ page }) => {
      // Wait for verification flow to load
      await expect(page.getByTestId('verification-flow')).toBeVisible();
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Step 1: Fill personal information
      await fillVerificationForm(page, TEST_USERS.GOOD_CREDIT);
      await clickContinue(page);

      // Step 2: Accept background check authorization
      await acceptBackgroundAuth(page);

      // Step 3: Accept credit check authorization
      await acceptCreditAuth(page);

      // Step 4: Payment - wait for payment selector
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();

      // Select saved card or fill new card
      await selectOrFillPaymentMethod(page);

      // Click continue to start payment
      await clickContinue(page);

      // Wait for verification to complete
      await waitForVerificationComplete(page);

      // Should redirect to verification list
      await expect(page).toHaveURL(/.*\/verification\/list.*/);
    });

    test('completes verification using dev test client selector', async ({ page }) => {
      // Wait for verification flow to load
      await expect(page.getByTestId('verification-flow')).toBeVisible();
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Use the Skip (Dev) button to select a test client
      await selectTestClient(page, TEST_USERS.GOOD_CREDIT.ssn);

      // Should automatically proceed to background auth step
      await expect(page.getByTestId('verification-step-background-auth')).toBeVisible();

      // Accept background check authorization
      await acceptBackgroundAuth(page);

      // Accept credit check authorization
      await acceptCreditAuth(page);

      // Wait for payment selector
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();

      // Select payment and continue
      await selectOrFillPaymentMethod(page);
      await clickContinue(page);

      // Wait for completion
      await waitForVerificationComplete(page);
    });
  });

  test.describe('Form Validation', () => {
    test('shows errors for empty form submission', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Try to continue with empty form
      await clickContinue(page);

      // Should show validation errors - form should not proceed
      await expect(page.getByTestId('verification-step-personal-info')).toBeVisible();

      // Check for error messages
      await expect(page.getByText(/required/i).first()).toBeVisible();
    });

    test('validates SSN format', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form with invalid SSN (less than 9 digits)
      await fillVerificationForm(page, {
        ...TEST_USERS.GOOD_CREDIT,
        ssn: '12345', // Invalid - only 5 digits
      });

      await clickContinue(page);

      // Should still be on personal info step with error
      await expect(page.getByTestId('verification-step-personal-info')).toBeVisible();
    });

    test('validates age requirement (must be 18+)', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Calculate a date that makes user under 18
      const today = new Date();
      const underageYear = today.getFullYear() - 17;
      const underageDob = `${underageYear}-01-01`;

      await fillVerificationForm(page, {
        ...TEST_USERS.GOOD_CREDIT,
        dob: underageDob,
      });

      await clickContinue(page);

      // Should show age validation error (date must be before certain date to be 18)
      await expect(page.getByTestId('verification-step-personal-info')).toBeVisible();
      // Error shows "Date must be before XX/XX/XXXX" or similar age-related error
      await expect(page.getByText(/must be before|18 or older/i)).toBeVisible();
    });

    test('validates required fields individually', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill only partial form (missing address)
      await page.getByPlaceholder('Enter First Name').fill('Test');
      await page.getByPlaceholder('Enter Last Name').fill('User');
      await page.getByPlaceholder('123-45-6789').fill('111111111');

      await clickContinue(page);

      // Should still be on personal info step
      await expect(page.getByTestId('verification-step-personal-info')).toBeVisible();
    });
  });

  test.describe('Authorization Steps', () => {
    test('requires background check authorization checkbox', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form and proceed
      await fillVerificationForm(page, TEST_USERS.GOOD_CREDIT);
      await clickContinue(page);

      // Wait for background auth step
      await expect(page.getByTestId('verification-step-background-auth')).toBeVisible();

      // Try to continue WITHOUT checking the checkbox
      await clickContinue(page);

      // Should still be on background auth step (not proceed)
      await expect(page.getByTestId('verification-step-background-auth')).toBeVisible();
    });

    test('requires credit check authorization checkbox', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form and proceed through background auth
      await fillVerificationForm(page, TEST_USERS.GOOD_CREDIT);
      await clickContinue(page);
      await acceptBackgroundAuth(page);

      // Wait for credit auth step
      await expect(page.getByTestId('verification-step-credit-auth')).toBeVisible();

      // Try to continue WITHOUT checking the checkbox
      await clickContinue(page);

      // Should still be on credit auth step
      await expect(page.getByTestId('verification-step-credit-auth')).toBeVisible();
    });
  });

  test.describe('Credit Check Errors', () => {
    test('handles invalid SSN error with retry option', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form with invalid SSN (000000000)
      await fillVerificationForm(page, TEST_USERS.INVALID_SSN);
      await clickContinue(page);

      // Accept authorizations
      await acceptBackgroundAuth(page);
      await acceptCreditAuth(page);

      // Complete payment
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();
      await selectOrFillPaymentMethod(page);
      await clickContinue(page);

      // Should show SSN error screen
      await waitForSsnError(page);

      // Verify retry button is available
      await expect(page.getByTestId('verification-primary-button')).toContainText(/retry/i);
    });

    test('handles no credit file error', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form with SSN that triggers no credit file (555555555)
      await fillVerificationForm(page, TEST_USERS.NO_CREDIT_FILE);
      await clickContinue(page);

      // Accept authorizations
      await acceptBackgroundAuth(page);
      await acceptCreditAuth(page);

      // Complete payment
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();
      await selectOrFillPaymentMethod(page);
      await clickContinue(page);

      // Should show no credit file error screen
      await waitForNoCreditFileError(page);

      // Verify retry button is available
      await expect(page.getByTestId('verification-primary-button')).toContainText(/retry/i);
    });

    test('retry after SSN error succeeds with valid SSN', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // First attempt with invalid SSN
      await fillVerificationForm(page, TEST_USERS.INVALID_SSN);
      await clickContinue(page);
      await acceptBackgroundAuth(page);
      await acceptCreditAuth(page);

      // Complete payment
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();
      await selectOrFillPaymentMethod(page);
      await clickContinue(page);

      // Wait for SSN error
      await waitForSsnError(page);

      // Update SSN in the retry form with valid SSN
      await page.getByPlaceholder('123-45-6789').fill(TEST_USERS.GOOD_CREDIT.ssn);

      // Click retry
      await page.getByTestId('verification-primary-button').click();

      // Should complete successfully
      await waitForVerificationComplete(page);
    });

    test('auto-refunds after second verification failure', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // First attempt with invalid SSN
      await fillVerificationForm(page, TEST_USERS.INVALID_SSN);
      await clickContinue(page);
      await acceptBackgroundAuth(page);
      await acceptCreditAuth(page);

      // Complete payment
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();
      await selectOrFillPaymentMethod(page);
      await clickContinue(page);

      // Wait for first error
      await waitForSsnError(page);

      // Retry with still-invalid SSN (different but still invalid)
      await page.getByPlaceholder('123-45-6789').fill('000000000');
      await page.getByTestId('verification-primary-button').click();

      // Should show verification failed screen with auto-refund
      await waitForVerificationFailed(page);

      // Verify refund message is shown
      await expect(page.getByText(/refund/i)).toBeVisible();
    });

    test('user can request refund after error', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form with invalid SSN
      await fillVerificationForm(page, TEST_USERS.INVALID_SSN);
      await clickContinue(page);
      await acceptBackgroundAuth(page);
      await acceptCreditAuth(page);

      // Complete payment
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();
      await selectOrFillPaymentMethod(page);
      await clickContinue(page);

      // Wait for error screen
      await waitForSsnError(page);

      // Click "Get Refund" button (secondary button)
      await page.getByTestId('verification-secondary-button').click();

      // Should show refund success screen
      await waitForRefundSuccess(page);
    });
  });

  test.describe('Payment Errors', () => {
    // Skip: Stripe PaymentElement iframe is complex to interact with for declined card testing
    test.skip('handles declined card', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form and proceed
      await fillVerificationForm(page, TEST_USERS.GOOD_CREDIT);
      await clickContinue(page);
      await acceptBackgroundAuth(page);
      await acceptCreditAuth(page);

      // Wait for payment selector
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();

      // Click "Add New Payment Method" to test with a declined card
      const addNewButton = page.getByText('Add New Payment Method');
      if (await addNewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addNewButton.click();
        await page.waitForTimeout(2000);
      }

      // Fill with declined card using helper
      await fillStripeCard(page, STRIPE_TEST_CARDS.DECLINED);

      await clickContinue(page);

      // Should show payment error
      await expect(page.getByText(/declined|failed|error/i)).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Navigation', () => {
    test('back button works on background auth step', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form and proceed
      await fillVerificationForm(page, TEST_USERS.GOOD_CREDIT);
      await clickContinue(page);

      // On background auth
      await expect(page.getByTestId('verification-step-background-auth')).toBeVisible();

      // Click back
      await clickBack(page);

      // Should be back on personal info
      await expect(page.getByTestId('verification-step-personal-info')).toBeVisible();
    });

    test('back button works on credit auth step', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form and proceed through background auth
      await fillVerificationForm(page, TEST_USERS.GOOD_CREDIT);
      await clickContinue(page);
      await acceptBackgroundAuth(page);

      // On credit auth
      await expect(page.getByTestId('verification-step-credit-auth')).toBeVisible();

      // Click back
      await clickBack(page);

      // Should be back on background auth
      await expect(page.getByTestId('verification-step-background-auth')).toBeVisible();
    });

    test('back button works on payment step', async ({ page }) => {
      await expect(page.getByTestId('personal-info-step')).toBeVisible();

      // Fill form and proceed through auth steps
      await fillVerificationForm(page, TEST_USERS.GOOD_CREDIT);
      await clickContinue(page);
      await acceptBackgroundAuth(page);
      await acceptCreditAuth(page);

      // On payment step
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();

      // Click back
      await clickBack(page);

      // Should be back on credit auth
      await expect(page.getByTestId('verification-step-credit-auth')).toBeVisible();
    });
  });

  test.describe('Redirect Behavior', () => {
    test('fresh user lands on verification page', async ({ page }) => {
      // Already on verification page from beforeEach
      await expect(page.getByTestId('verification-flow')).toBeVisible();
      await expect(page.getByTestId('personal-info-step')).toBeVisible();
    });

    test('user with valid verification redirects to list', async ({ page }) => {
      // Complete a full verification first
      await fillVerificationForm(page, TEST_USERS.GOOD_CREDIT);
      await clickContinue(page);
      await acceptBackgroundAuth(page);
      await acceptCreditAuth(page);

      // Complete payment
      await expect(page.getByTestId('processing-screen-select-payment')).toBeVisible();
      await selectOrFillPaymentMethod(page);
      await clickContinue(page);

      // Wait for completion
      await waitForVerificationComplete(page);

      // Now try to navigate back to verification page
      await page.goto('/app/rent/verification');

      // Should be redirected to verification list
      await expect(page).toHaveURL(/.*\/verification\/list.*/);
    });
  });
});

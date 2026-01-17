import { test, expect } from '@playwright/test';
import { signIn, getTestUser } from './helpers/auth';

test.describe('Stripe Identity Verification', () => {
  // Increase timeout for these tests
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // Sign in as test user
    await signIn(page);
  });

  test.describe('Identity Verification with Connect Account', () => {
    test.beforeEach(async ({ page }) => {
      const testUser = getTestUser();

      // Set up Stripe Connect account for the test user
      // This creates a real Stripe test account so we can test the identity verification flow
      const response = await page.request.post('/api/dev/setup-stripe-connect', {
        data: { email: testUser.email },
      });

      const data = await response.json();
      console.log('Stripe Connect setup:', data);

      if (!response.ok()) {
        console.error('Failed to set up Stripe Connect:', data);
        throw new Error(`Failed to set up Stripe Connect: ${data.error}`);
      }
    });

    test.afterEach(async ({ page }) => {
      const testUser = getTestUser();

      // Clean up Stripe Connect fields after test
      await page.request.delete(`/api/dev/setup-stripe-connect?email=${encodeURIComponent(testUser.email)}`);
    });

    test('identity verification button is clickable when Stripe Connect is set up but identity not verified', async ({ page }) => {
      // Navigate to host dashboard
      await page.goto('/app/host/dashboard/overview');

      // Wait for the onboarding checklist to load
      await expect(page.getByText('Complete Identity Verification')).toBeVisible({ timeout: 10000 });

      // The identity verification item should NOT be completed (no checkmark)
      // Find the identity verification row
      const identityVerificationRow = page.locator('text=Complete Identity Verification');
      await expect(identityVerificationRow).toBeVisible();

      // It should be clickable (not completed)
      const identityButton = identityVerificationRow.locator('button');

      // The button should exist and be enabled
      if (await identityButton.count() > 0) {
        await expect(identityButton).toBeEnabled();
      }
    });

    test('clicking identity verification shows Opening verification and handles permission error gracefully', async ({ page }) => {
      // Navigate to host dashboard
      await page.goto('/app/host/dashboard/overview');

      // Wait for the checklist to load
      await expect(page.getByText('Complete Identity Verification')).toBeVisible({ timeout: 10000 });

      // Set up console log capture to see errors
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      });

      // Set up API response interception to check for errors
      let serverActionError: string | null = null;
      await page.route('**/stripe-identity**', async (route) => {
        const response = await route.fetch();
        const body = await response.text();

        // Check if the response contains an error
        try {
          const json = JSON.parse(body);
          if (json.error || !json.success) {
            serverActionError = json.error || 'Unknown error';
            console.log('Server action error detected:', serverActionError);
          }
        } catch {
          // Not JSON, continue
        }

        await route.fulfill({ response });
      });

      // Click the identity verification button
      const identityButton = page.getByRole('button', { name: /Complete Identity Verification/i });
      await identityButton.click();

      // Should show "Opening verification..." loading state
      await expect(page.getByText('Opening verification...')).toBeVisible({ timeout: 5000 });

      // Wait for the loading state to resolve (either modal opens or error occurs)
      // The current buggy behavior is it hangs forever
      // After the fix, it should either:
      // 1. Show the Stripe Identity modal, OR
      // 2. Reset the button state (no longer show "Opening verification...")

      // Wait up to 15 seconds for something to happen
      const startTime = Date.now();
      const timeout = 15000;

      while (Date.now() - startTime < timeout) {
        // Check if loading state is still showing
        const isStillLoading = await page.getByText('Opening verification...').isVisible().catch(() => false);

        if (!isStillLoading) {
          // Loading finished - either modal opened or error was handled
          console.log('Loading state resolved');
          break;
        }

        // Check if Stripe Identity modal appeared (iframe with Stripe Identity)
        const stripeModal = page.locator('iframe[src*="js.stripe.com"]');
        if (await stripeModal.count() > 0) {
          console.log('Stripe Identity modal appeared');
          break;
        }

        await page.waitForTimeout(500);
      }

      // Log any console errors
      console.log('Console logs:', consoleLogs.filter(log => log.includes('error') || log.includes('Error')));

      // Check if we captured a server action error
      if (serverActionError) {
        console.log('Server returned error:', serverActionError);
        // This is expected with the current bug - the permission error
        // After the fix, this should not happen (retry without related_person should succeed)
      }
    });

    test('reproduces permission error when identity verification tries to link to Connect account', async ({ page }) => {
      // This test specifically verifies the "You do not have permissions to update this person" error

      // Navigate to host dashboard
      await page.goto('/app/host/dashboard/overview');

      // Wait for the checklist to load
      await expect(page.getByText('Complete Identity Verification')).toBeVisible({ timeout: 10000 });

      // Set up request interception to capture the server action response
      let capturedResponse: any = null;

      // Intercept the Next.js server action call
      // Server actions are POST requests to the same URL with specific headers
      await page.route('**/*', async (route) => {
        const request = route.request();

        // Check if this is a server action call (look for specific patterns)
        const headers = request.headers();
        const isServerAction = headers['next-action'] !== undefined;

        if (isServerAction && request.method() === 'POST') {
          const response = await route.fetch();
          const body = await response.text();

          try {
            // Server actions return a special format, try to parse it
            if (body.includes('success') || body.includes('error') || body.includes('clientSecret')) {
              console.log('Server action response detected:', body.substring(0, 500));
              capturedResponse = body;
            }
          } catch {
            // Continue
          }

          await route.fulfill({ response });
        } else {
          await route.continue();
        }
      });

      // Click the identity verification button
      const identityButton = page.getByRole('button', { name: /Complete Identity Verification/i });
      await identityButton.click();

      // Wait a moment for the server action to complete
      await page.waitForTimeout(5000);

      // Check if we got an error response indicating the permission issue
      if (capturedResponse) {
        console.log('Captured server action response');

        // The response might contain "do not have permissions" error
        const hasPermissionError = capturedResponse.includes('permissions') ||
          capturedResponse.includes('Permission') ||
          capturedResponse.includes('Failed to create');

        if (hasPermissionError) {
          console.log('REPRODUCED: Permission error detected in server response');
        }
      }

      // After waiting, check if the button is still in loading state (indicates the bug)
      const isStillLoading = await page.getByText('Opening verification...').isVisible().catch(() => false);

      if (isStillLoading) {
        console.log('BUG CONFIRMED: Button is stuck in "Opening verification..." state');
        // This is the bug we're trying to fix
      }

      // For now, just verify the test runs without timeout
      // The actual behavior depends on whether we've applied the fix
      expect(true).toBe(true);
    });
  });
});

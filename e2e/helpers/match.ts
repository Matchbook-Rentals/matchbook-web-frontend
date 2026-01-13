// Helper functions for match/approval flow in E2E tests
import { Page, APIRequestContext, expect } from '@playwright/test';

/**
 * Navigate to the host's application view for a specific housing request
 */
export async function navigateToApplicationView(
  page: Page,
  listingId: string,
  housingRequestId: string
): Promise<void> {
  await page.goto(`/app/host/${listingId}/applications/${housingRequestId}`);
  await page.waitForLoadState('networkidle');

  // Wait for the application details to load
  await page.waitForTimeout(1000);
}

/**
 * Navigate to the host's applications dashboard for a listing
 */
export async function navigateToHostApplications(
  page: Page,
  listingId: string
): Promise<void> {
  await page.goto(`/app/host/${listingId}/applications`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to the host's general applications dashboard
 */
export async function navigateToHostDashboardApplications(page: Page): Promise<void> {
  await page.goto('/app/host/dashboard/applications');
  await page.waitForLoadState('networkidle');
}

/**
 * Find a housing request in the applications list
 */
export async function findHousingRequest(
  page: Page,
  housingRequestId: string
): Promise<boolean> {
  const requestCard = page.locator(`[data-housing-request-id="${housingRequestId}"]`).first();
  return await requestCard.isVisible({ timeout: 5000 }).catch(() => false);
}

/**
 * Approve a housing request as a host
 * This creates a Match record
 */
export async function approveHousingRequest(
  page: Page,
  listingId: string,
  housingRequestId: string
): Promise<{ success: boolean; matchId?: string }> {
  // Navigate to the application details
  await navigateToApplicationView(page, listingId, housingRequestId);

  // Look for and click the approve button
  const approveButton = page.getByRole('button', { name: /approve/i }).first();

  if (await approveButton.isVisible({ timeout: 5000 })) {
    await approveButton.click();

    // Wait for approval to process
    await page.waitForTimeout(2000);

    // Check for success indication
    const successIndicator = page.getByText(/approved|match created/i).first();
    if (await successIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Try to extract match ID from URL or page
      const matchId = await extractMatchId(page);
      return { success: true, matchId };
    }
  }

  return { success: false };
}

/**
 * Decline a housing request as a host
 */
export async function declineHousingRequest(
  page: Page,
  listingId: string,
  housingRequestId: string
): Promise<boolean> {
  // Navigate to the application details
  await navigateToApplicationView(page, listingId, housingRequestId);

  // Look for decline button (might be in a dropdown menu)
  const declineButton = page.getByRole('button', { name: /decline/i }).first();
  if (await declineButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await declineButton.click();
  } else {
    // Try finding in dropdown menu
    const moreButton = page.locator('[data-testid="more-options"], button:has-text("...")').first();
    if (await moreButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await moreButton.click();
      const declineMenuItem = page.getByText(/decline/i).first();
      if (await declineMenuItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await declineMenuItem.click();
      }
    }
  }

  // Wait for decline to process
  await page.waitForTimeout(2000);

  // Check for declined status
  const declinedIndicator = page.getByText(/declined/i).first();
  return await declinedIndicator.isVisible({ timeout: 5000 }).catch(() => false);
}

/**
 * Upload a lease document for a housing request
 */
export async function uploadLeaseDocument(
  page: Page,
  listingId: string,
  housingRequestId: string,
  leasePath?: string
): Promise<boolean> {
  // Navigate to application details
  await navigateToApplicationView(page, listingId, housingRequestId);

  // Look for upload lease button or link
  const uploadButton = page.getByRole('button', { name: /upload lease|add lease/i }).first();
  if (await uploadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await uploadButton.click();

    // Handle file upload if path provided
    if (leasePath) {
      const fileInput = page.locator('input[type="file"][accept*="pdf"]').first();
      if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fileInput.setInputFiles(leasePath);
        await page.waitForTimeout(2000);
        return true;
      }
    }
  }

  return false;
}

/**
 * Create a lease using the in-house PDF editor
 */
export async function createLeaseWithEditor(
  page: Page,
  listingId: string,
  housingRequestId: string
): Promise<{ success: boolean; documentId?: string }> {
  // Navigate to application details
  await navigateToApplicationView(page, listingId, housingRequestId);

  // Look for create lease button
  const createLeaseButton = page.getByRole('button', { name: /create lease|new lease/i }).first();
  if (await createLeaseButton.isVisible({ timeout: 3000 })) {
    await createLeaseButton.click();

    // Wait for lease editor to open (could redirect or open modal)
    await page.waitForTimeout(2000);

    // Check if we're in the lease editor
    const leaseEditor = page.locator('[data-testid="lease-editor"], .pdf-editor').first();
    if (await leaseEditor.isVisible({ timeout: 5000 }).catch(() => false)) {
      // In a real test, you would interact with the editor here
      // For now, look for a save/submit button
      const saveButton = page.getByRole('button', { name: /save|create|submit/i }).first();
      if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Extract document ID
        const documentId = await extractDocumentId(page);
        return { success: true, documentId };
      }
    }
  }

  return { success: false };
}

/**
 * Select a lease template for the housing request
 */
export async function selectLeaseTemplate(
  page: Page,
  templateName?: string
): Promise<boolean> {
  // Look for lease selection dialog
  const leaseDialog = page.locator('[data-testid="lease-selection-dialog"], [role="dialog"]').first();

  if (await leaseDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Find and select template
    if (templateName) {
      const templateOption = leaseDialog.getByText(templateName, { exact: false }).first();
      if (await templateOption.isVisible()) {
        await templateOption.click();
      }
    } else {
      // Select first available template
      const firstTemplate = leaseDialog.locator('[data-template-id], .template-option').first();
      if (await firstTemplate.isVisible()) {
        await firstTemplate.click();
      }
    }

    // Confirm selection
    const selectButton = leaseDialog.getByRole('button', { name: /select|use this|confirm/i }).first();
    if (await selectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectButton.click();
      await page.waitForTimeout(1000);
      return true;
    }
  }

  return false;
}

/**
 * Extract match ID from the current page
 */
async function extractMatchId(page: Page): Promise<string | undefined> {
  const url = page.url();

  // Try to extract from URL
  const urlMatch = url.match(/match[es]?\/([a-z0-9-]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Try to find in page content
  const matchElement = page.locator('[data-match-id]').first();
  if (await matchElement.isVisible({ timeout: 2000 }).catch(() => false)) {
    return await matchElement.getAttribute('data-match-id') || undefined;
  }

  return undefined;
}

/**
 * Extract document ID from the current page
 */
async function extractDocumentId(page: Page): Promise<string | undefined> {
  const url = page.url();

  // Try URL patterns
  const docMatch = url.match(/document[s]?\/([a-z0-9-]+)/i);
  if (docMatch) {
    return docMatch[1];
  }

  // Try data attributes
  const docElement = page.locator('[data-document-id]').first();
  if (await docElement.isVisible({ timeout: 2000 }).catch(() => false)) {
    return await docElement.getAttribute('data-document-id') || undefined;
  }

  return undefined;
}

/**
 * Get match details via dev API
 */
export async function getMatchById(
  request: APIRequestContext,
  matchId: string
): Promise<any | null> {
  const response = await request.get(`/api/dev/matches?id=${matchId}`);
  const data = await response.json();

  if (data.matches && data.matches.length > 0) {
    return data.matches[0];
  }
  return null;
}

/**
 * Get match for a trip and listing via dev API
 */
export async function getMatchByTripAndListing(
  request: APIRequestContext,
  tripId: string,
  listingId: string
): Promise<any | null> {
  const response = await request.get(`/api/dev/matches?tripId=${tripId}&listingId=${listingId}`);
  const data = await response.json();

  if (data.matches && data.matches.length > 0) {
    return data.matches[0];
  }
  return null;
}

/**
 * Get all matches for a trip via dev API
 */
export async function getMatchesForTrip(
  request: APIRequestContext,
  tripId: string
): Promise<any[]> {
  const response = await request.get(`/api/dev/matches?tripId=${tripId}`);
  const data = await response.json();
  return data.matches || [];
}

/**
 * Verify a match was created successfully
 */
export async function verifyMatchCreated(
  request: APIRequestContext,
  tripId: string,
  listingId: string
): Promise<boolean> {
  const match = await getMatchByTripAndListing(request, tripId, listingId);
  return match !== null;
}

/**
 * Get housing request status
 */
export async function getHousingRequestStatus(
  request: APIRequestContext,
  housingRequestId: string
): Promise<string | null> {
  const response = await request.get(`/api/dev/housing-requests?id=${housingRequestId}`);
  const data = await response.json();

  if (data.housingRequests && data.housingRequests.length > 0) {
    return data.housingRequests[0].status;
  }
  return null;
}

/**
 * Verify housing request was approved
 */
export async function verifyHousingRequestApproved(
  request: APIRequestContext,
  housingRequestId: string
): Promise<boolean> {
  const status = await getHousingRequestStatus(request, housingRequestId);
  return status === 'approved';
}

/**
 * Update a match with lease document via dev API
 */
export async function updateMatchWithLeaseDocument(
  request: APIRequestContext,
  matchId: string,
  leaseDocumentId: string
): Promise<boolean> {
  try {
    const response = await request.patch(`/api/dev/matches/${matchId}`, {
      data: { leaseDocumentId }
    });
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Navigate to match details page (renter view)
 */
export async function navigateToMatchDetails(
  page: Page,
  matchId: string
): Promise<void> {
  await page.goto(`/app/rent/match/${matchId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to lease signing page for a match
 */
export async function navigateToLeaseSigning(
  page: Page,
  matchId: string
): Promise<void> {
  await page.goto(`/app/rent/match/${matchId}/lease-signing`);
  await page.waitForLoadState('networkidle');
}

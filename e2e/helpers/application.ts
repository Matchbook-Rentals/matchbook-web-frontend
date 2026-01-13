// Helper functions for application creation and management in E2E tests
import { Page, APIRequestContext, expect } from '@playwright/test';

export interface ApplicationData {
  // Personal Info
  firstName?: string;
  lastName?: string;
  middleName?: string;
  noMiddleName?: boolean;
  dateOfBirth?: string; // YYYY-MM-DD format

  // Identification
  idType?: string;
  idNumber?: string;
  skipIdPhoto?: boolean;

  // Income
  incomeSource?: string;
  monthlyIncome?: string;
  skipIncomeProof?: boolean;

  // Residential History
  currentStreet?: string;
  currentCity?: string;
  currentState?: string;
  currentZipCode?: string;
  currentMonthlyPayment?: string;
  durationOfTenancy?: string;
  landlordFirstName?: string;
  landlordLastName?: string;
  landlordPhone?: string;
  landlordEmail?: string;

  // Questionnaire
  evicted?: boolean;
  brokenLease?: boolean;
  felony?: boolean;
  landlordDispute?: boolean;
  evictedExplanation?: string;
  felonyExplanation?: string;
}

// Default test application data
export const DEFAULT_APPLICATION_DATA: ApplicationData = {
  firstName: 'Test',
  lastName: 'Renter',
  middleName: '',
  noMiddleName: true,
  dateOfBirth: '1990-01-15',
  idType: 'drivers_license',
  idNumber: 'DL123456789',
  skipIdPhoto: true, // Skip photo upload in tests
  incomeSource: 'Employment',
  monthlyIncome: '5000',
  skipIncomeProof: true, // Skip proof upload in tests
  currentStreet: '456 Test Ave',
  currentCity: 'Austin',
  currentState: 'TX',
  currentZipCode: '78702',
  currentMonthlyPayment: '1200',
  durationOfTenancy: '24',
  landlordFirstName: 'John',
  landlordLastName: 'Landlord',
  landlordPhone: '5125551234',
  landlordEmail: 'landlord@test.com',
  evicted: false,
  brokenLease: false,
  felony: false,
  landlordDispute: false,
};

/**
 * Fill out a complete application form
 * Navigates to the application page and fills all sections
 */
export async function fillApplication(
  page: Page,
  applicationData: ApplicationData = DEFAULT_APPLICATION_DATA
): Promise<void> {
  const data = { ...DEFAULT_APPLICATION_DATA, ...applicationData };

  // Navigate to the general application page
  await navigateToApplicationPage(page);

  // Fill each section
  await fillPersonalInfo(page, data);
  await fillIdentification(page, data);
  await fillResidentialHistory(page, data);
  await fillIncome(page, data);
  await fillQuestionnaire(page, data);

  // Save the application
  await saveApplication(page);
}

/**
 * Navigate to the application page
 */
export async function navigateToApplicationPage(page: Page): Promise<void> {
  await page.goto('/app/rent/applications/general');
  await page.waitForLoadState('networkidle');

  // Wait for the form to load
  await page.waitForTimeout(1000);
}

/**
 * Fill personal information section
 */
async function fillPersonalInfo(page: Page, data: ApplicationData): Promise<void> {
  // First name
  const firstNameInput = page.locator('input[name="firstName"], [data-testid="firstName-input"]').first();
  if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await firstNameInput.fill(data.firstName || '');
  }

  // Last name
  const lastNameInput = page.locator('input[name="lastName"], [data-testid="lastName-input"]').first();
  if (await lastNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await lastNameInput.fill(data.lastName || '');
  }

  // Middle name or no middle name checkbox
  if (data.noMiddleName) {
    const noMiddleNameCheckbox = page.locator('[data-testid="noMiddleName"], input[name="noMiddleName"]').first();
    if (await noMiddleNameCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await noMiddleNameCheckbox.click();
    }
  } else if (data.middleName) {
    const middleNameInput = page.locator('input[name="middleName"], [data-testid="middleName-input"]').first();
    if (await middleNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await middleNameInput.fill(data.middleName);
    }
  }

  // Date of birth
  const dobInput = page.locator('input[name="dateOfBirth"], [data-testid="dateOfBirth-input"]').first();
  if (await dobInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dobInput.fill(data.dateOfBirth || '');
  }
}

/**
 * Fill identification section
 */
async function fillIdentification(page: Page, data: ApplicationData): Promise<void> {
  // ID Type - look for select or dropdown
  const idTypeSelect = page.locator('select[name*="idType"], [data-testid="idType-select"]').first();
  if (await idTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await idTypeSelect.selectOption(data.idType || 'drivers_license');
  } else {
    // Try button-based selector
    const idTypeButton = page.locator('[data-testid="idType-trigger"]').first();
    if (await idTypeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await idTypeButton.click();
      const option = page.getByText(data.idType || 'Driver\'s License', { exact: false }).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }
  }

  // ID Number
  const idNumberInput = page.locator('input[name*="idNumber"], [data-testid="idNumber-input"]').first();
  if (await idNumberInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await idNumberInput.fill(data.idNumber || '');
  }

  // Skip ID photo upload in E2E tests unless explicitly needed
  if (!data.skipIdPhoto) {
    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Would need actual test images in e2e/fixtures/
      console.log('ID photo upload step - may need test images');
    }
  }
}

/**
 * Fill residential history section
 */
async function fillResidentialHistory(page: Page, data: ApplicationData): Promise<void> {
  // Current address - Street
  const streetInput = page.locator('input[name*="street"], [data-testid="street-input"]').first();
  if (await streetInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await streetInput.fill(data.currentStreet || '');
  }

  // City
  const cityInput = page.locator('input[name*="city"], [data-testid="city-input"]').first();
  if (await cityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cityInput.fill(data.currentCity || '');
  }

  // State
  const stateInput = page.locator('input[name*="state"], select[name*="state"], [data-testid="state-input"]').first();
  if (await stateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    const tagName = await stateInput.evaluate(el => el.tagName.toLowerCase());
    if (tagName === 'select') {
      await stateInput.selectOption(data.currentState || 'TX');
    } else {
      await stateInput.fill(data.currentState || '');
    }
  }

  // ZIP Code
  const zipInput = page.locator('input[name*="zip"], [data-testid="zipCode-input"]').first();
  if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await zipInput.fill(data.currentZipCode || '');
  }

  // Monthly payment
  const paymentInput = page.locator('input[name*="monthlyPayment"], [data-testid="monthlyPayment-input"]').first();
  if (await paymentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await paymentInput.fill(data.currentMonthlyPayment || '');
  }

  // Duration of tenancy
  const durationInput = page.locator('input[name*="duration"], [data-testid="duration-input"]').first();
  if (await durationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await durationInput.fill(data.durationOfTenancy || '');
  }

  // Landlord info
  await fillLandlordInfo(page, data);
}

/**
 * Fill landlord information
 */
async function fillLandlordInfo(page: Page, data: ApplicationData): Promise<void> {
  // Landlord first name
  const landlordFirstNameInput = page.locator('input[name*="landlordFirstName"], [data-testid="landlordFirstName-input"]').first();
  if (await landlordFirstNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await landlordFirstNameInput.fill(data.landlordFirstName || '');
  }

  // Landlord last name
  const landlordLastNameInput = page.locator('input[name*="landlordLastName"], [data-testid="landlordLastName-input"]').first();
  if (await landlordLastNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await landlordLastNameInput.fill(data.landlordLastName || '');
  }

  // Landlord phone
  const landlordPhoneInput = page.locator('input[name*="landlordPhone"], [data-testid="landlordPhone-input"]').first();
  if (await landlordPhoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await landlordPhoneInput.fill(data.landlordPhone || '');
  }

  // Landlord email
  const landlordEmailInput = page.locator('input[name*="landlordEmail"], [data-testid="landlordEmail-input"]').first();
  if (await landlordEmailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await landlordEmailInput.fill(data.landlordEmail || '');
  }
}

/**
 * Fill income section
 */
async function fillIncome(page: Page, data: ApplicationData): Promise<void> {
  // Income source
  const sourceInput = page.locator('input[name*="source"], [data-testid="incomeSource-input"]').first();
  if (await sourceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sourceInput.fill(data.incomeSource || '');
  } else {
    // Try select dropdown
    const sourceSelect = page.locator('select[name*="source"], [data-testid="incomeSource-select"]').first();
    if (await sourceSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sourceSelect.selectOption(data.incomeSource || 'Employment');
    }
  }

  // Monthly amount
  const amountInput = page.locator('input[name*="monthlyAmount"], [data-testid="monthlyAmount-input"]').first();
  if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await amountInput.fill(data.monthlyIncome || '');
  }

  // Skip income proof upload in E2E tests unless explicitly needed
  if (!data.skipIncomeProof) {
    const fileInput = page.locator('input[type="file"]').nth(1);
    if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Income proof upload step - may need test documents');
    }
  }
}

/**
 * Fill questionnaire section
 */
async function fillQuestionnaire(page: Page, data: ApplicationData): Promise<void> {
  // Evicted question
  await answerBooleanQuestion(page, 'evicted', data.evicted || false, data.evictedExplanation);

  // Broken lease question
  await answerBooleanQuestion(page, 'brokenLease', data.brokenLease || false);

  // Felony question
  await answerBooleanQuestion(page, 'felony', data.felony || false, data.felonyExplanation);

  // Landlord dispute question
  await answerBooleanQuestion(page, 'landlordDispute', data.landlordDispute || false);
}

/**
 * Answer a yes/no question in the questionnaire
 */
async function answerBooleanQuestion(
  page: Page,
  questionName: string,
  answer: boolean,
  explanation?: string
): Promise<void> {
  // Find the question container
  const answerValue = answer ? 'yes' : 'no';

  // Try radio buttons
  const radioButton = page.locator(`input[name="${questionName}"][value="${answerValue}"], [data-testid="${questionName}-${answerValue}"]`).first();
  if (await radioButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await radioButton.click();
  } else {
    // Try button-style toggle
    const toggleButton = page.locator(`[data-testid="${questionName}-toggle-${answerValue}"], button:has-text("${answer ? 'Yes' : 'No'}")`).first();
    if (await toggleButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await toggleButton.click();
    }
  }

  // Fill explanation if answer is yes and explanation provided
  if (answer && explanation) {
    const explanationInput = page.locator(`textarea[name="${questionName}Explanation"], [data-testid="${questionName}-explanation"]`).first();
    if (await explanationInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await explanationInput.fill(explanation);
    }
  }
}

/**
 * Save the application form
 */
async function saveApplication(page: Page): Promise<void> {
  // Look for save button
  const saveButton = page.getByRole('button', { name: /save|submit|continue/i }).first();
  if (await saveButton.isVisible({ timeout: 3000 })) {
    await saveButton.click();
  }

  // Wait for save to complete
  await page.waitForTimeout(2000);
}

/**
 * Apply to a listing from a trip
 */
export async function applyToListing(
  page: Page,
  tripId: string,
  listingId: string
): Promise<void> {
  // Navigate to the trip page
  await page.goto(`/app/rent/searches/${tripId}`);
  await page.waitForLoadState('networkidle');

  // Find the listing card
  const listingCard = page.locator(`[data-listing-id="${listingId}"]`).first();

  if (await listingCard.isVisible({ timeout: 5000 })) {
    // Click apply button on the listing
    const applyButton = listingCard.locator('button:has-text("Apply"), [data-testid="apply-button"]').first();
    if (await applyButton.isVisible({ timeout: 3000 })) {
      await applyButton.click();
    }
  } else {
    // Try clicking a general apply button
    const applyButton = page.getByRole('button', { name: /apply/i }).first();
    await applyButton.click();
  }

  // Wait for application submission
  await page.waitForTimeout(2000);
}

/**
 * Submit an application to a specific listing
 * This assumes the user already has a completed application profile
 */
export async function submitApplicationToListing(
  page: Page,
  tripId: string,
  listingId: string
): Promise<string | null> {
  // Navigate to the listing detail from the trip
  await page.goto(`/app/rent/searches/${tripId}`);
  await page.waitForLoadState('networkidle');

  // Find and click apply for the specific listing
  await applyToListing(page, tripId, listingId);

  // Look for confirmation or housing request ID
  const url = page.url();
  const housingRequestMatch = url.match(/housing-request[s]?\/([a-z0-9-]+)/i);
  if (housingRequestMatch) {
    return housingRequestMatch[1];
  }

  // Try to extract from page content
  const housingRequestElement = page.locator('[data-housing-request-id]').first();
  if (await housingRequestElement.isVisible({ timeout: 2000 }).catch(() => false)) {
    return await housingRequestElement.getAttribute('data-housing-request-id');
  }

  return null;
}

/**
 * Get application details via dev API
 */
export async function getApplicationByUserId(
  request: APIRequestContext,
  userId: string
): Promise<any | null> {
  const response = await request.get(`/api/dev/users?id=${userId}`);
  const data = await response.json();

  if (data.users && data.users.length > 0 && data.users[0].applications) {
    return data.users[0].applications[0] || null;
  }
  return null;
}

/**
 * Get housing request by ID via dev API
 */
export async function getHousingRequestById(
  request: APIRequestContext,
  housingRequestId: string
): Promise<any | null> {
  const response = await request.get(`/api/dev/housing-requests?id=${housingRequestId}`);
  const data = await response.json();

  if (data.housingRequests && data.housingRequests.length > 0) {
    return data.housingRequests[0];
  }
  return null;
}

/**
 * Get all housing requests for a listing via dev API
 */
export async function getHousingRequestsByListingId(
  request: APIRequestContext,
  listingId: string
): Promise<any[]> {
  const response = await request.get(`/api/dev/housing-requests?listingId=${listingId}`);
  const data = await response.json();
  return data.housingRequests || [];
}

/**
 * Check if a user's application is complete
 */
export async function isApplicationComplete(
  request: APIRequestContext,
  userId: string
): Promise<boolean> {
  const application = await getApplicationByUserId(request, userId);
  return application?.isComplete === true;
}

/**
 * Verify application was submitted successfully
 */
export async function verifyApplicationSubmitted(
  page: Page,
  listingTitle?: string
): Promise<boolean> {
  // Look for success indicators
  const successIndicators = [
    page.getByText(/application submitted/i),
    page.getByText(/successfully applied/i),
    page.getByText(/application received/i),
    page.locator('[data-testid="application-success"]'),
  ];

  for (const indicator of successIndicators) {
    if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      return true;
    }
  }

  // Check if the apply button is now disabled or shows "Applied"
  const appliedIndicator = page.getByText(/applied|pending/i).first();
  if (await appliedIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
    return true;
  }

  return false;
}

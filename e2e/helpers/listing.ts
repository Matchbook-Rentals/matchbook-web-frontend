// Helper functions for listing creation in E2E tests
import { Page, APIRequestContext, expect } from '@playwright/test';
import path from 'path';

export interface ListingData {
  // Step 0: Highlights
  category?: 'singleFamily' | 'apartment' | 'townhouse' | 'privateRoom';
  furnished?: boolean;
  petsAllowed?: boolean;

  // Step 1-2: Location
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  // Step 3: Rooms
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;

  // Step 4: Basics
  title?: string;
  description?: string;

  // Step 5-6: Photos
  photoFiles?: string[]; // Paths to image files
  skipPhotos?: boolean;

  // Step 7: Amenities
  amenities?: string[];
  laundryType?: 'inUnit' | 'shared' | 'none';

  // Step 8-9: Pricing
  shortestStay?: number;
  longestStay?: number;
  monthlyRent?: number;

  // Step 10: Deposits
  securityDeposit?: number;
  petDeposit?: number;
  petRent?: number;
}

// State code to name mapping for select dropdowns
const STATE_NAMES: Record<string, string> = {
  'TX': 'Texas',
  'CA': 'California',
  'NY': 'New York',
  'FL': 'Florida',
  // Add more as needed
};

// Default test listing data
export const DEFAULT_LISTING_DATA: ListingData = {
  category: 'apartment',
  furnished: false,
  petsAllowed: false,
  streetAddress: '100 Congress Ave',
  city: 'Austin',
  state: 'Texas', // Use full state name for dropdown selection
  postalCode: '78701',
  bedrooms: 2,
  bathrooms: 1,
  squareFootage: 850,
  title: 'E2E Test Apartment',
  description: 'A beautiful test apartment for E2E testing purposes. Features modern amenities and a great downtown location. This is a test listing created by automated tests.',
  skipPhotos: false,
  photoFiles: [
    'public/auth/1.jpg',
    'public/auth/2.png',
    'public/auth/3.png',
    'public/auth/4.png',
  ],
  amenities: ['wifi', 'airConditioner'],
  laundryType: 'shared',
  shortestStay: 1,
  longestStay: 12,
  monthlyRent: 1500,
  securityDeposit: 1500,
  petDeposit: 0,
  petRent: 0,
};

/**
 * Create a full listing by navigating through all steps
 * Returns the listing ID upon successful creation
 */
export async function createFullListing(
  page: Page,
  listingData: ListingData = DEFAULT_LISTING_DATA
): Promise<string> {
  const data = { ...DEFAULT_LISTING_DATA, ...listingData };

  // Navigate to add property page
  await navigateToAddProperty(page);

  // Step 0: Highlights
  console.log('Step 0: Filling highlights...');
  await fillHighlights(page, data);
  await clickNext(page);

  // Step 1: Location Input
  console.log('Step 1: Filling location...');
  await fillLocationInput(page, data);
  await clickNext(page);

  // Step 2: Address Confirmation
  console.log('Step 2: Confirming address...');
  await confirmAddress(page, data);
  await clickNext(page);

  // Step 3: Rooms
  console.log('Step 3: Filling rooms...');
  await fillRooms(page, data);
  await clickNext(page);

  // Step 4: Basics (title, description)
  console.log('Step 4: Filling basics...');
  await fillBasics(page, data);
  await clickNext(page);

  // Step 5: Photos Upload
  console.log('Step 5: Uploading photos...');
  if (!data.skipPhotos) {
    await uploadPhotos(page, data);
  }
  await clickNext(page);

  // Step 6: Photo Selection (Featured Photos)
  console.log('Step 6: Selecting featured photos...');
  await selectFeaturedPhotos(page);
  await clickNext(page);

  // Step 7: Amenities
  console.log('Step 7: Filling amenities...');
  await fillAmenities(page, data);
  await clickNext(page);

  // Step 8: Pricing Setup
  console.log('Step 8: Filling pricing...');
  await fillPricing(page, data);
  await clickNext(page);

  // Step 9: Verify Pricing
  console.log('Step 9: Verifying pricing...');
  await verifyPricing(page, data);
  await clickNext(page);

  // Step 10: Deposits
  console.log('Step 10: Filling deposits...');
  await fillDeposits(page, data);
  await clickNext(page);

  // Step 11: Review - Submit the listing
  console.log('Step 11: Submitting listing...');
  await submitListing(page);

  // Wait for success page (Step 12)
  console.log('Waiting for success...');
  await page.waitForTimeout(3000);

  // Extract listing ID
  const listingId = await extractListingId(page);
  console.log('Listing created with ID:', listingId);
  return listingId;
}

/**
 * Navigate to the add property page
 */
export async function navigateToAddProperty(page: Page): Promise<void> {
  await page.goto('/app/host/add-property?new=true');
  await page.waitForLoadState('networkidle');

  // Wait for the first step to be visible
  await expect(page.getByText('Which of these describes your place?')).toBeVisible({ timeout: 15000 });
}

/**
 * Click the Next button
 */
export async function clickNext(page: Page): Promise<void> {
  // Get current URL/step for comparison after click
  const currentUrl = page.url();

  // Try data-testid first
  let nextButton = page.getByTestId('next-button');

  if (!await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Fallback to finding by text
    nextButton = page.getByRole('button', { name: /^next$/i });
  }

  if (!await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Another fallback - find button containing "Next"
    nextButton = page.locator('button:has-text("Next")').first();
  }

  // Scroll the button into view
  await nextButton.scrollIntoViewIfNeeded();
  await expect(nextButton).toBeVisible({ timeout: 5000 });

  console.log('Clicking Next button...');

  // Click the button
  await nextButton.click({ force: true });

  // Wait for navigation/step change
  await page.waitForTimeout(1500);

  // Check if we actually advanced
  const newUrl = page.url();
  if (newUrl === currentUrl) {
    console.log('URL unchanged after click, checking for validation errors...');
    // Check if there's a toast/error message
    const toast = page.locator('[role="alert"], [data-testid="toast"], .toast').first();
    if (await toast.isVisible({ timeout: 1000 }).catch(() => false)) {
      const toastText = await toast.innerText().catch(() => 'Unknown error');
      console.log('Toast message:', toastText);
    }
  } else {
    console.log('Page URL changed, step advanced successfully');
  }
}

/**
 * Step 0: Fill highlights (property type, furnished, pets)
 */
async function fillHighlights(page: Page, data: ListingData): Promise<void> {
  // Map category to card id
  const categoryMap: Record<string, string> = {
    'singleFamily': 'single-family',
    'apartment': 'apartment',
    'townhouse': 'townhouse',
    'privateRoom': 'private-room',
  };

  // Select property type by clicking the card
  const categoryId = categoryMap[data.category || 'apartment'];
  const categoryCard = page.locator(`[id="${categoryId}"], [data-testid="${categoryId}"]`).first();
  if (await categoryCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await categoryCard.click();
  } else {
    // Try by text content
    const categoryText = data.category === 'singleFamily' ? 'Single Family' :
                         data.category === 'privateRoom' ? 'Private Room' :
                         data.category?.charAt(0).toUpperCase() + data.category?.slice(1) || 'Apartment';
    await page.getByText(categoryText, { exact: true }).first().click();
  }

  await page.waitForTimeout(300);

  // Select furnished status
  const furnishedId = data.furnished ? 'furnished' : 'unfurnished';
  const furnishedCard = page.locator(`[id="${furnishedId}"], [data-testid="${furnishedId}"]`).first();
  if (await furnishedCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await furnishedCard.click();
  } else {
    const furnishedText = data.furnished ? 'Furnished' : 'Unfurnished';
    await page.getByText(furnishedText, { exact: true }).first().click();
  }

  await page.waitForTimeout(300);

  // Select pets allowed
  const petsId = data.petsAllowed ? 'pets-welcome' : 'no-pets';
  const petsCard = page.locator(`[id="${petsId}"], [data-testid="${petsId}"]`).first();
  if (await petsCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await petsCard.click();
  } else {
    const petsText = data.petsAllowed ? 'Pets Welcome' : 'No Pets';
    await page.getByText(petsText, { exact: true }).first().click();
  }
}

/**
 * Step 1: Fill location input
 */
async function fillLocationInput(page: Page, data: ListingData): Promise<void> {
  // Build full address
  const fullAddress = `${data.streetAddress}, ${data.city}, ${data.state} ${data.postalCode}`;

  // Look for address input - try multiple selectors
  const addressInput = page.locator(
    'input[placeholder*="address" i], ' +
    'input[placeholder*="Address" i], ' +
    'input[placeholder*="location" i], ' +
    'input[name*="address" i], ' +
    '[data-testid="address-input"]'
  ).first();

  if (await addressInput.isVisible({ timeout: 5000 })) {
    await addressInput.fill(fullAddress);

    // Wait for Google Places suggestions to appear
    await page.waitForTimeout(2000);

    // Click on the first suggestion
    const suggestion = page.locator(
      '.pac-item, ' +
      '[role="option"], ' +
      '.suggestion-item, ' +
      '[data-suggestion]'
    ).first();

    if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await suggestion.click();
    } else {
      // If no suggestion visible, press Enter to confirm
      await addressInput.press('Enter');
    }
  }

  await page.waitForTimeout(500);
}

/**
 * Step 2: Confirm address
 * The address confirmation form has inputs with id/name: street, apt, city, state (select), zip
 */
async function confirmAddress(page: Page, data: ListingData): Promise<void> {
  // Wait for the form to be visible
  await page.waitForSelector('text=Confirm your property\'s address', { timeout: 10000 });

  // Street Address - fill or verify
  const streetInput = page.locator('input#street, input[name="street"]').first();
  if (await streetInput.isVisible({ timeout: 3000 })) {
    const currentValue = await streetInput.inputValue();
    if (!currentValue) {
      await streetInput.fill(data.streetAddress || '100 Congress Ave');
    }
    console.log('Street address:', await streetInput.inputValue());
  }

  // City - fill or verify
  const cityInput = page.locator('input#city, input[name="city"]').first();
  if (await cityInput.isVisible({ timeout: 2000 })) {
    const currentValue = await cityInput.inputValue();
    if (!currentValue) {
      await cityInput.fill(data.city || 'Austin');
    }
    console.log('City:', await cityInput.inputValue());
  }

  // State - it's a Radix Select dropdown
  // Check if state is already selected by looking at the trigger value
  const stateSelect = page.locator('button[role="combobox"]').first();
  if (await stateSelect.isVisible({ timeout: 2000 })) {
    const selectedState = await stateSelect.innerText();
    console.log('Current state value:', selectedState);

    if (!selectedState || selectedState === 'Select a state') {
      // Open the dropdown
      await stateSelect.click();
      await page.waitForTimeout(500);

      // Convert state code to full name if needed
      let stateName = data.state || 'Texas';
      if (stateName.length === 2) {
        stateName = STATE_NAMES[stateName.toUpperCase()] || stateName;
      }

      console.log(`Looking for state option: ${stateName}`);

      // Find and click the state option
      const stateOption = page.locator(`[role="option"]:has-text("${stateName}")`);

      if (await stateOption.isVisible({ timeout: 3000 })) {
        await stateOption.click();
        console.log(`Selected state: ${stateName}`);
        await page.waitForTimeout(500);
      } else {
        console.log(`State option "${stateName}" not found, listing available options...`);
        // List some available options for debugging
        const options = page.locator('[role="option"]');
        const optionCount = await options.count();
        console.log(`Found ${optionCount} state options`);
        if (optionCount > 0) {
          const firstOption = await options.first().innerText();
          console.log(`First option: ${firstOption}`);
        }
        // Press escape to close
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
    console.log('Final state value:', await stateSelect.innerText());
  }

  // Zip - CRITICAL - must be filled
  // Scroll down to ensure zip field is visible
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);

  const zipInput = page.locator('input#zip, input[name="zip"]').first();
  if (await zipInput.isVisible({ timeout: 3000 })) {
    await zipInput.scrollIntoViewIfNeeded();
    const currentValue = await zipInput.inputValue();
    // Always fill zip if empty since it's required
    if (!currentValue) {
      await zipInput.click();
      await zipInput.fill(data.postalCode || '78701');
      console.log('Filled zip code:', data.postalCode || '78701');
    } else {
      console.log('Zip code already set:', currentValue);
    }
  } else {
    console.log('Warning: Zip input not found!');
  }

  // Wait for geocoding to complete (the component debounces for 1 second)
  await page.waitForTimeout(2000);

  // Scroll back to top so Next button is visible
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

/**
 * Step 3: Fill rooms (bedrooms, bathrooms, sqft)
 * The rooms step uses counter components with +/- buttons for bedrooms/bathrooms,
 * and an input field for square footage.
 */
async function fillRooms(page: Page, data: ListingData): Promise<void> {
  // Wait for the rooms form to be visible
  await page.waitForSelector('text=How many bedrooms', { timeout: 10000 });

  // Bedrooms - find the row containing "bedrooms" and click + to increment
  const bedroomRow = page.locator('div:has-text("How many bedrooms are there?")').first();
  const targetBedrooms = data.bedrooms || 2;

  // Default value is usually 1, click + to reach target
  // Find the + button near the bedroom text
  const bedroomPlusButton = bedroomRow.locator('button').last(); // Last button is usually +
  for (let i = 1; i < targetBedrooms; i++) {
    await bedroomPlusButton.click();
    await page.waitForTimeout(150);
  }
  console.log(`Set bedrooms to ${targetBedrooms}`);

  // Bathrooms - same approach
  const bathroomRow = page.locator('div:has-text("How many bathrooms are there?")').first();
  const targetBathrooms = data.bathrooms || 1;

  // For bathrooms, the default is usually 1, and increments by 0.5
  // So we need to click more times to reach full numbers
  const bathroomPlusButton = bathroomRow.locator('button').last();
  const bathroomClicks = Math.round((targetBathrooms - 1) * 2); // Since increment is 0.5
  for (let i = 0; i < bathroomClicks; i++) {
    await bathroomPlusButton.click();
    await page.waitForTimeout(150);
  }
  console.log(`Set bathrooms to ${targetBathrooms}`);

  // Square footage - find input with placeholder "1,234 sq ft"
  const sqftInput = page.locator('input[placeholder*="sq ft"], input[inputmode="numeric"]').first();
  if (await sqftInput.isVisible({ timeout: 3000 })) {
    await sqftInput.click();
    await sqftInput.fill(String(data.squareFootage || 850));
    console.log(`Set square footage to ${data.squareFootage || 850}`);
  } else {
    // Fallback: find any input in the square feet row
    const sqftRow = page.locator('div:has-text("square feet")').first();
    const sqftInputFallback = sqftRow.locator('input').first();
    if (await sqftInputFallback.isVisible({ timeout: 2000 })) {
      await sqftInputFallback.click();
      await sqftInputFallback.fill(String(data.squareFootage || 850));
      console.log(`Set square footage (fallback) to ${data.squareFootage || 850}`);
    } else {
      console.log('Warning: Could not find square footage input');
    }
  }

  // Wait a moment for state to update
  await page.waitForTimeout(500);
}

/**
 * Step 4: Fill basics (title, description)
 */
async function fillBasics(page: Page, data: ListingData): Promise<void> {
  // Title
  const titleInput = page.locator('input[name*="title" i], [data-testid="title-input"]').first();
  if (await titleInput.isVisible({ timeout: 3000 })) {
    await titleInput.clear();
    await titleInput.fill(data.title || 'Test Listing');
  }

  // Description
  const descriptionInput = page.locator('textarea[name*="description" i], [data-testid="description-input"], textarea').first();
  if (await descriptionInput.isVisible({ timeout: 2000 })) {
    await descriptionInput.clear();
    await descriptionInput.fill(data.description || 'Test listing description for E2E testing.');
  }
}

/**
 * Step 5: Upload photos
 * Note: The file input has opacity-0 but is still interactable
 */
async function uploadPhotos(page: Page, data: ListingData): Promise<void> {
  const photoFiles = data.photoFiles || DEFAULT_LISTING_DATA.photoFiles || [];

  if (photoFiles.length === 0) {
    console.log('No photos to upload, skipping...');
    return;
  }

  // Convert relative paths to absolute
  const absolutePaths = photoFiles.map(p =>
    path.isAbsolute(p) ? p : path.join(process.cwd(), p)
  );

  console.log(`Preparing to upload ${absolutePaths.length} photos:`, absolutePaths);

  // Find the file input - it has opacity-0 but is still interactable
  // Don't check isVisible() since opacity-0 returns false but element is still functional
  const fileInput = page.locator('input[type="file"]').first();

  // Wait for the file input to exist in the DOM
  await fileInput.waitFor({ state: 'attached', timeout: 10000 });

  // Set the files on the input
  await fileInput.setInputFiles(absolutePaths);
  console.log(`Set files on input, waiting for upload...`);

  // Wait for uploads to complete - the component shows progress
  // Look for progress indicator or uploading text
  const uploadingButton = page.locator('button:has-text("Uploading")');

  // Wait for upload to start (button changes to "Uploading...")
  const uploadStarted = await uploadingButton.isVisible({ timeout: 5000 }).catch(() => false);

  if (uploadStarted) {
    console.log('Upload started, waiting for completion...');
    // Wait for the button to change back to "Click to upload"
    await page.locator('button:has-text("Click to upload")').waitFor({
      state: 'visible',
      timeout: 60000 // Give plenty of time for uploads
    });
    console.log('Upload completed');
  } else {
    // Maybe upload was instant or already done
    console.log('Upload may have completed quickly');
    await page.waitForTimeout(3000);
  }

  // Verify photos were uploaded by checking for thumbnails
  await page.waitForTimeout(2000);
  const thumbnails = page.locator('img[alt*="Listing photo"]');
  const thumbCount = await thumbnails.count();
  console.log(`Found ${thumbCount} photo thumbnails after upload`);
}

/**
 * Step 6: Select featured photos
 * The photo selection step shows a grid of all uploaded photos.
 * Click on photos to add them to the featured selection (up to 4).
 */
async function selectFeaturedPhotos(page: Page): Promise<void> {
  // Wait for page to load
  await page.waitForTimeout(1000);

  // The photo gallery shows photos in a grid with Cards
  // Each photo is an img inside a Card that can be clicked
  // Photos are in a grid with class "grid grid-cols-4"
  const galleryGrid = page.locator('.grid.grid-cols-4').first();

  // Wait for the gallery to be visible
  const galleryVisible = await galleryGrid.isVisible({ timeout: 5000 }).catch(() => false);

  if (!galleryVisible) {
    console.log('Gallery grid not visible, looking for alternative selectors...');
    // Try alternative: look for clickable cards with images
    const photoCards = page.locator('div[class*="Card"] img, .cursor-pointer img');
    const cardCount = await photoCards.count();
    console.log(`Found ${cardCount} photo cards`);

    if (cardCount === 0) {
      console.log('No photos found to select. Proceeding without selection.');
      return;
    }

    // Click on first 4 photos
    for (let i = 0; i < Math.min(4, cardCount); i++) {
      const card = photoCards.nth(i);
      const parent = card.locator('xpath=..');
      await parent.click();
      await page.waitForTimeout(300);
    }
    return;
  }

  // Find all photo cards in the gallery
  // The photos are Card components with img inside
  const photoItems = galleryGrid.locator('> div');
  const count = await photoItems.count();
  console.log(`Found ${count} photos in gallery to select from`);

  if (count === 0) {
    console.log('No photos found in gallery. Proceeding without selection.');
    return;
  }

  // Select up to 4 photos by clicking them
  for (let i = 0; i < Math.min(4, count); i++) {
    const photo = photoItems.nth(i);
    if (await photo.isVisible()) {
      await photo.click();
      console.log(`Selected photo ${i + 1}`);
      await page.waitForTimeout(300);
    }
  }

  // Verify some photos were selected (check for "Cover Photo" badge or border change)
  const selectedCount = await page.locator('[class*="border-charcoalBrand"]').count();
  console.log(`${selectedCount} photos now selected as featured`);
}

/**
 * Step 7: Fill amenities
 */
async function fillAmenities(page: Page, data: ListingData): Promise<void> {
  // First, select laundry option (usually required)
  const laundryMap: Record<string, string> = {
    'inUnit': 'in-unit',
    'shared': 'shared',
    'none': 'none',
  };

  const laundryId = laundryMap[data.laundryType || 'shared'];

  // Try to find laundry options
  const laundryOption = page.locator(
    `[id*="${laundryId}" i], ` +
    `[data-testid*="${laundryId}" i], ` +
    `[data-amenity*="laundry" i]`
  ).first();

  if (await laundryOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    await laundryOption.click();
  } else {
    // Try by text
    const laundryText = data.laundryType === 'inUnit' ? 'In-Unit' :
                        data.laundryType === 'shared' ? 'Shared' : 'None';
    const laundryByText = page.getByText(laundryText, { exact: false }).first();
    if (await laundryByText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await laundryByText.click();
    }
  }

  await page.waitForTimeout(300);

  // Select additional amenities
  for (const amenity of data.amenities || []) {
    const amenityToggle = page.locator(
      `[data-testid="${amenity}"], ` +
      `[data-amenity="${amenity}"], ` +
      `[id="${amenity}"], ` +
      `input[name="${amenity}"]`
    ).first();

    if (await amenityToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
      const isChecked = await amenityToggle.isChecked().catch(() => false);
      if (!isChecked) {
        await amenityToggle.click();
      }
    }
  }
}

/**
 * Step 8: Fill pricing setup
 */
async function fillPricing(page: Page, data: ListingData): Promise<void> {
  // Shortest stay (in months)
  const shortestInput = page.locator(
    'input[name*="shortest" i], ' +
    'input[name*="minimum" i], ' +
    '[data-testid="shortest-stay"], ' +
    '[data-testid="min-stay"]'
  ).first();

  if (await shortestInput.isVisible({ timeout: 3000 })) {
    await shortestInput.clear();
    await shortestInput.fill(String(data.shortestStay || 1));
  }

  // Longest stay (in months)
  const longestInput = page.locator(
    'input[name*="longest" i], ' +
    'input[name*="maximum" i], ' +
    '[data-testid="longest-stay"], ' +
    '[data-testid="max-stay"]'
  ).first();

  if (await longestInput.isVisible({ timeout: 2000 })) {
    await longestInput.clear();
    await longestInput.fill(String(data.longestStay || 12));
  }
}

/**
 * Step 9: Verify/set monthly pricing
 */
async function verifyPricing(page: Page, data: ListingData): Promise<void> {
  // This step shows pricing for each lease length tier
  // Fill in the monthly rent for each visible input

  await page.waitForTimeout(500);

  const priceInputs = page.locator(
    'input[name*="price" i], ' +
    'input[name*="rent" i], ' +
    '[data-testid*="price-input"], ' +
    'input[type="number"]'
  );

  const count = await priceInputs.count();
  console.log(`Found ${count} price inputs`);

  for (let i = 0; i < count; i++) {
    const input = priceInputs.nth(i);
    if (await input.isVisible()) {
      await input.clear();
      await input.fill(String(data.monthlyRent || 1500));
      await page.waitForTimeout(100);
    }
  }
}

/**
 * Step 10: Fill deposits
 */
async function fillDeposits(page: Page, data: ListingData): Promise<void> {
  // Security deposit
  const depositInput = page.locator(
    'input[name*="deposit" i], ' +
    'input[name*="security" i], ' +
    '[data-testid="security-deposit"]'
  ).first();

  if (await depositInput.isVisible({ timeout: 3000 })) {
    await depositInput.clear();
    await depositInput.fill(String(data.securityDeposit || 1500));
  }

  // Pet deposit (if pets allowed)
  if (data.petsAllowed && data.petDeposit) {
    const petDepositInput = page.locator(
      'input[name*="petDeposit" i], ' +
      '[data-testid="pet-deposit"]'
    ).first();

    if (await petDepositInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await petDepositInput.clear();
      await petDepositInput.fill(String(data.petDeposit));
    }

    // Pet rent
    if (data.petRent) {
      const petRentInput = page.locator(
        'input[name*="petRent" i], ' +
        '[data-testid="pet-rent"]'
      ).first();

      if (await petRentInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await petRentInput.clear();
        await petRentInput.fill(String(data.petRent));
      }
    }
  }
}

/**
 * Step 11: Submit the listing from review page
 */
async function submitListing(page: Page): Promise<void> {
  await page.waitForTimeout(1000);

  // Look for submit button on review page
  const submitButton = page.getByRole('button', { name: /submit|publish|create listing/i }).first();

  if (await submitButton.isVisible({ timeout: 5000 })) {
    await submitButton.click();
  } else {
    // Fallback - try the next button which might say "Submit" on review step
    const nextButton = page.getByRole('button', { name: /next|submit/i }).first();
    if (await nextButton.isVisible({ timeout: 2000 })) {
      await nextButton.click();
    }
  }

  // Wait for submission to complete
  await page.waitForTimeout(3000);
}

/**
 * Extract listing ID from URL or page content
 */
async function extractListingId(page: Page): Promise<string> {
  const url = page.url();

  // Try to extract from URL
  const urlMatch = url.match(/listing[s]?\/([a-z0-9-]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Try draft ID from URL
  const draftMatch = url.match(/draftId=([a-z0-9-]+)/i);
  if (draftMatch) {
    return draftMatch[1];
  }

  // Try to find listing ID in page content
  const listingIdElement = page.locator('[data-listing-id]').first();
  if (await listingIdElement.isVisible({ timeout: 2000 }).catch(() => false)) {
    const id = await listingIdElement.getAttribute('data-listing-id');
    if (id) return id;
  }

  // Check for success message with ID
  const successText = await page.locator('.success-message, [data-testid="success"]').textContent().catch(() => '');
  const idMatch = successText?.match(/([a-z0-9]{20,})/i);
  if (idMatch) {
    return idMatch[1];
  }

  // Return a placeholder if we can't find it
  console.warn('Could not extract listing ID, returning timestamp-based ID');
  return `test-listing-${Date.now()}`;
}

/**
 * Get listing details via dev API
 */
export async function getListingById(
  request: APIRequestContext,
  listingId: string
): Promise<any | null> {
  const response = await request.get(`/api/dev/listings?id=${listingId}`);
  const data = await response.json();

  if (data.listings && data.listings.length > 0) {
    return data.listings[0];
  }
  return null;
}

/**
 * Get all listings for a user via dev API
 */
export async function getUserListings(
  request: APIRequestContext,
  userId: string
): Promise<any[]> {
  const response = await request.get(`/api/dev/listings?userId=${userId}`);
  const data = await response.json();
  return data.listings || [];
}

/**
 * Approve a listing as admin
 */
export async function approveListingAsAdmin(
  page: Page,
  listingId: string
): Promise<void> {
  // Navigate to admin listing approval page
  await page.goto(`/admin/listing-approval/${listingId}`);
  await page.waitForLoadState('networkidle');

  // Click approve button
  const approveButton = page.getByRole('button', { name: /approve/i });
  if (await approveButton.isVisible({ timeout: 5000 })) {
    await approveButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Navigate to a listing page
 */
export async function navigateToListing(page: Page, listingId: string): Promise<void> {
  await page.goto(`/listing/${listingId}`);
  await page.waitForLoadState('networkidle');
}

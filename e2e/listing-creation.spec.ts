/**
 * Listing Creation Test
 *
 * This is a SEPARATE test file for creating test listings.
 * Run this ONCE to create a permanent listing for the test host:
 *   npx playwright test listing-creation.spec.ts
 *
 * The booking-flow.spec.ts will use this existing listing instead of creating new ones.
 * This saves ~1.4 minutes per test run since listing creation is slow.
 *
 * To create a fresh listing, run this file again - it will create a new listing
 * (old listings will remain but won't be used since we use the most recent one).
 */

import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import {
  getTestAccounts,
  signInTestAccount,
  signOutTestAccount,
} from './fixtures/booking-flow.fixture';
import { createFullListing, DEFAULT_LISTING_DATA, findExistingListingByEmail } from './helpers/listing';

const testAccounts = getTestAccounts();

test.describe('Listing Creation', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(300000); // 5 minute timeout for listing creation

  test('Check if listing exists for test host', async ({ request }) => {
    const existingListing = await findExistingListingByEmail(request, testAccounts.host.email);

    if (existingListing) {
      console.log('\n=== Existing Listing Found ===');
      console.log(`Listing ID: ${existingListing.listingId}`);
      console.log(`Title: ${existingListing.title}`);
      console.log('==============================\n');
      console.log('You can skip creating a new listing unless you need a fresh one.');
    } else {
      console.log('\n❌ No listing found for test host.');
      console.log('Run the "Create permanent listing for test host" test to create one.\n');
    }
  });

  test('Create permanent listing for test host', async ({ page }) => {
    await setupClerkTestingToken({ page });

    // Sign in as host
    const signedIn = await signInTestAccount(
      page,
      testAccounts.host.email,
      testAccounts.host.password
    );
    expect(signedIn).toBe(true);

    // Create a listing with a recognizable title
    const listingData = {
      ...DEFAULT_LISTING_DATA,
      title: `E2E Permanent Test Listing`,
      description: 'This is a permanent test listing for E2E booking flow tests. Do not delete.',
    };

    console.log('\nCreating permanent test listing...');
    const listingId = await createFullListing(page, listingData);

    console.log('\n=== Listing Created Successfully ===');
    console.log(`Listing ID: ${listingId}`);
    console.log(`Title: ${listingData.title}`);
    console.log('=====================================\n');

    expect(listingId).toBeTruthy();

    await signOutTestAccount(page);
  });
});

test.describe('Listing Management', () => {
  test('List all listings for test host', async ({ request }) => {
    // Find user first
    const userResponse = await request.get(`/api/dev/users?search=${encodeURIComponent(testAccounts.host.email)}`);
    const userData = await userResponse.json();

    if (!userData.users || userData.users.length === 0) {
      console.log('No user found with email:', testAccounts.host.email);
      return;
    }

    const user = userData.users[0];
    console.log(`\nUser: ${user.id} (${user.email})`);

    // Get all listings
    const listingsResponse = await request.get(`/api/dev/listings?userId=${user.id}&limit=50`);
    const listingsData = await listingsResponse.json();

    console.log(`\n=== Listings for Test Host (${listingsData.count} total) ===`);
    for (const listing of listingsData.listings || []) {
      console.log(`  - ${listing.id}: "${listing.title}" (${listing.status})`);
    }
    console.log('==============================================\n');
  });
});

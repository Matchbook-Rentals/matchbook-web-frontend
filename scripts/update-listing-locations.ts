// Use require for CommonJS compatibility with ts-node in this context
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
import type { Listing } from '@prisma/client'; // Keep type import

// Define the structure of an address in the JSON file
// Adjust this interface based on the actual structure of Austin_addresses.JSON
interface AddressData {
  street?: string;
  housenumber?: string; // Assuming housenumber might be separate
  city?: string;
  postcode?: string; // Or zip
  lat?: number;
  lon?: number;
  // Add other relevant fields present in your JSON
}

const prisma = new PrismaClient();
const addressesFilePath = path.join(__dirname, './addresses/', 'austin_addresses.JSON'); // Assumes JSON is in the root
const BATCH_SIZE = 1000; // Max listings to fetch

async function updateListings() {
  console.log('Starting listing location update script...');

  // 1. Read and parse the address data
  let addresses: AddressData[] = [];
  try {
    if (!fs.existsSync(addressesFilePath)) {
      console.error(`Error: Address file not found at ${addressesFilePath}`);
      return;
    }
    const fileContent = fs.readFileSync(addressesFilePath, 'utf-8');
    addresses = JSON.parse(fileContent);
    if (!Array.isArray(addresses) || addresses.length === 0) {
      console.error('Error: Address file is empty or not a valid JSON array.');
      return;
    }
    console.log(`Successfully loaded ${addresses.length} addresses from ${addressesFilePath}`);
  } catch (error) {
    console.error('Error reading or parsing address file:', error);
    return;
  }

  // 2. Fetch listings with latitude = 0
  let listingsToUpdate: Listing[] = [];
  try {
    listingsToUpdate = await prisma.listing.findMany({
      where: {
        latitude: 0,
      },
      take: BATCH_SIZE,
    });

    if (listingsToUpdate.length === 0) {
      console.log('No listings found with latitude = 0. Exiting.');
      return;
    }
    console.log(`Found ${listingsToUpdate.length} listings with latitude = 0 to update.`);

  } catch (error) {
    console.error('Error fetching listings:', error);
    return;
  }

  // 3. Iterate and update listings
  const totalUpdates = Math.min(listingsToUpdate.length, addresses.length);
  console.log(`Attempting to update ${totalUpdates} listings...`);
  let updatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < totalUpdates; i++) {
    const listing = listingsToUpdate[i];
    const addressData = addresses[i];

    // Prepare update data, mapping JSON fields to Prisma schema fields
    // Adjust field names (e.g., postcode vs zip, lon vs longitude) as needed
    const updateData: Partial<Listing> = {};
    if (addressData.lat !== undefined) updateData.latitude = addressData.lat;
    if (addressData.lon !== undefined) updateData.longitude = addressData.lon;
    if (addressData.street !== undefined) {
        // Combine housenumber and street if they are separate in JSON
        updateData.streetAddress1 = addressData.housenumber
            ? `${addressData.housenumber} ${addressData.street}`
            : addressData.street;
    }
    if (addressData.city !== undefined) updateData.city = addressData.city;
    // Assuming 'zip' is the field in your Prisma schema for postal code
    if (addressData.postcode !== undefined) updateData.postalCode = addressData.postcode;
    // Add state if available in your JSON and schema
    updateData.state = 'TX';
    updateData.locationString= `${addressData.housenumber} ${addressData.street}, ${addressData.city}, ${updateData.state}, ${addressData.postcode} `

    // Skip update if no valid lat/lon found
    if (updateData.latitude === undefined || updateData.longitude === undefined) {
        console.warn(`Skipping listing ${listing.id}: Missing lat/lon in address data index ${i}.`);
        continue;
    }

    try {
      await prisma.listing.update({
        where: { id: listing.id },
        data: updateData,
      });
      updatedCount++;
      console.log(`(${updatedCount}/${totalUpdates}) Updated listing ${listing.id}`);
    } catch (error) {
      failedCount++;
      console.error(`Failed to update listing ${listing.id}:`, error);
      // Decide if you want to stop on error or continue
    }
  }

  console.log('--------------------');
  console.log('Update process finished.');
  console.log(`Successfully updated: ${updatedCount}`);
  console.log(`Failed updates: ${failedCount}`);
  console.log(`Listings remaining with latitude 0 (if any): ${listingsToUpdate.length - updatedCount}`);
  console.log(`Addresses remaining in JSON (if any): ${addresses.length - totalUpdates}`);
}

updateListings()
  .catch((e) => {
    console.error('Unhandled error during script execution:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  });

const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const prisma = new PrismaClient();

async function parseAndUploadCSV(filePath) {
  const listings = [];
  let rowCount = 0;

  // Count total rows first
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', () => rowCount++)
      .on('end', resolve)
      .on('error', reject); // Added error handling for read stream
  });

  // Check if file has headers before reading them
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  if (lines.length === 0 || lines[0].trim() === '') {
    console.error('CSV file is empty or has no header row.');
    await prisma.$disconnect();
    return;
  }
  const headers = lines[0].split(',').map(h => h.trim()); // Trim headers

  // Ensure 'Completed' header exists or add it
  const headerConfig = headers.map(h => ({ id: h, title: h }));
  if (!headers.includes('Completed')) {
    headerConfig.push({ id: 'Completed', title: 'Completed' });
  }

  // Create CsvWriter instance - Note: This overwrites the file if append: false (default)
  // If you intend to update the file in place, more complex logic is needed.
  // This script currently reads the whole file, processes, and potentially writes back.
  // Writing back to the *same file* while reading it is problematic.
  // Consider writing completion status to a separate file or database field.
  // For now, commenting out the writer setup as it conflicts with the read stream logic.
  /*
  const csvWriter = createCsvWriter({
    path: filePath, // Writing to the same file being read can cause issues
    header: headerConfig,
    append: true // Append might not work as expected if headers change or file is rewritten
  });
  */

  const readStream = fs.createReadStream(filePath).pipe(csv());

  readStream.on('data', (row) => {
    // Basic validation: Check if essential fields exist
    if (!row.Listing_Title || !row.Description || !row.Main_Image_URL) {
        console.warn(`Skipping row due to missing essential data: ${JSON.stringify(row)}`);
        return; // Skip this row
    }
    listings.push(row);
  });

  readStream.on('end', async () => {
    console.log(`Finished reading CSV. Total rows found: ${rowCount}. Rows pushed to process list: ${listings.length}`);
    let processedCount = 0;
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const currentRowNum = i + 2; // +1 for 0-index, +1 for header row

      // Skip if already completed - check case-insensitively and trim whitespace
      if (listing.Completed && listing.Completed.trim().toLowerCase() === 'true') {
        console.log(`Skipping row ${currentRowNum}/${rowCount + 1} - Already completed: ${listing.Listing_Title}`);
        continue;
      }

      console.log(`Processing row ${currentRowNum}/${rowCount + 1}: ${listing.Listing_Title}`);

      try {
        // Data transformation and validation
        const roomCount = parseInt(listing.Bedrooms) || 1;
        const bathroomCount = parseFloat(listing.Bathrooms) || 1;
        const squareFootage = parseInt(listing.Square_Footage) || 400; // Default if missing/invalid
        const mainImageUrl = listing.Main_Image_URL;

        // Basic check for valid URL (can be improved)
        if (!mainImageUrl || !mainImageUrl.startsWith('http')) {
            console.warn(`Skipping row ${currentRowNum} due to invalid Main_Image_URL: ${mainImageUrl}`);
            continue;
        }

        // Create listing images array safely
        const listingImagesCreate = [{ url: mainImageUrl, rank: 1 }];
        for (let j = 1; j <= 7; j++) {
            const imageUrl = listing[`Image_URL_${j}`];
            if (imageUrl && imageUrl.startsWith('http')) { // Check if URL exists and is valid
                listingImagesCreate.push({ url: imageUrl, rank: j + 1 });
            }
        }

        // Create bedrooms array
        const bedroomsCreate = Array(roomCount)
          .fill()
          .map((_, index) => ({
            bedroomNumber: index + 1,
            bedType: 'Queen', // Default bed type
          }));

        // Determine boolean fields based on description (case-insensitive)
        const descriptionLower = listing.Description.toLowerCase();
        const wifi = descriptionLower.includes('wifi');
        const washerInUnit = descriptionLower.includes('washer');
        const dryerInUnit = descriptionLower.includes('dryer');
        const parking = descriptionLower.includes('parking');
        const petsAllowed = descriptionLower.includes('pet-friendly') || descriptionLower.includes('pets allowed');
        const pool = descriptionLower.includes('pool');
        const privateEntrance = descriptionLower.includes('private entrance');
        const fencedInYard = descriptionLower.includes('fenced');
        const jacuzzi = descriptionLower.includes('jacuzzi') || descriptionLower.includes('hot tub');
        const tv = descriptionLower.includes('tv') || descriptionLower.includes('television');
        const microwave = descriptionLower.includes('microwave');
        const fridge = descriptionLower.includes('refrigerator') || descriptionLower.includes('fridge');
        const dishwasher = descriptionLower.includes('dishwasher');

        // Create listing in database
        const newListing = await prisma.listing.create({
          data: {
            title: listing.Listing_Title,
            description: listing.Description,
            imageSrc: mainImageUrl, // Use validated main image URL
            roomCount: roomCount,
            bathroomCount: bathroomCount,
            squareFootage: squareFootage,
            userId: 'clw71k4ot0000txv15h7l7xmf', // Replace with actual user ID - IMPORTANT
            // address fields? city, state, zip? Assuming they might be in CSV or need defaults
            // location field? (Requires lat/lng)
            // price field?
            furnished: true, // Assuming default, adjust if needed
            kitchen: true, // Assuming default, adjust if needed
            privateBathroom: true, // Assuming default, adjust if needed
            listingImages: {
              create: listingImagesCreate,
            },
            bedrooms: {
              create: bedroomsCreate,
            },
            // Amenities based on description parsing
            wifi: wifi,
            washerInUnit: washerInUnit,
            dryerInUnit: dryerInUnit,
            parking: parking,
            petsAllowed: petsAllowed,
            pool: pool,
            privateEntrance: privateEntrance,
            fencedInYard: fencedInYard,
            jacuzzi: jacuzzi,
            tv: tv,
            microwave: microwave,
            fridge: fridge,
            dishwasher: dishwasher,
            // Add other relevant fields from your prisma schema
            // e.g., status, category, pricePerMonth, etc.
            status: 'pending', // Default status?
            category: 'Apartment', // Default category?
            pricePerMonth: 0, // Default price? Needs source from CSV or default
          },
        });

        processedCount++;
        console.log(`Successfully created listing for row ${currentRowNum}/${rowCount + 1}: ${newListing.title} (ID: ${newListing.id})`);

        // Mark as completed - IMPORTANT: This part needs careful implementation.
        // Writing back to the same CSV being read is generally unsafe.
        // Option 1: Write to a new CSV file.
        // Option 2: Update a database flag for the source row (if source has unique ID).
        // Option 3: Keep track of completed rows in memory/separate file and skip them on next run.
        // Commenting out the direct write back for safety.
        // listing.Completed = 'true';
        // await csvWriter.writeRecords([listing]); // This line is problematic

      } catch (error) {
        console.error(`Error processing row ${currentRowNum}/${rowCount + 1} - ${listing.Listing_Title}:`, error);
        // Decide if you want to stop the script on error or continue
      }
    }

    console.log(`Processing complete. Processed ${processedCount} out of ${listings.length} valid rows read from CSV.`);
    await prisma.$disconnect();
  });

  readStream.on('error', async (error) => {
      console.error('Error reading CSV stream:', error);
      await prisma.$disconnect();
  });
}

// Ensure the CSV file path is correct and accessible
const csvFilePath = 'Listings_with_Final_Bathroom_Estimates.csv';
if (fs.existsSync(csvFilePath)) {
    parseAndUploadCSV(csvFilePath).catch(async (e) => {
      console.error('Unhandled error during script execution:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
} else {
    console.error(`Error: CSV file not found at path: ${csvFilePath}`);
    process.exit(1);
}

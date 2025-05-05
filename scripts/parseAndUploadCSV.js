const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const filePath = './Listings_with_Final_Bathroom_Estimates.csv'

const prisma = new PrismaClient();

async function parseAndUploadCSV() {
  let rowCount = 0;
  let processedCount = 0;

  // Count total rows
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', () => rowCount++)
      .on('end', resolve)
      .on('error', reject);
  });

  if (rowCount === 0) {
    console.error('CSV file is empty or has no data rows.');
    await prisma.$disconnect();
    return;
  }

  // Setup completed rows CSV writer
  const completedRowsWriter = createCsvWriter({
    path: 'completed_rows.csv',
    header: [{ id: 'completedRow', title: 'completedRow' }],
    append: true
  });

  const readStream = fs.createReadStream(filePath).pipe(csv());
  let currentRowNum = 1; // Start at 1 for header row

  readStream.on('data', async (row) => {
    currentRowNum++;

    if (!row.Listing_Title || !row.Description || !row.Main_Image_URL) {
      console.warn(`Skipping row ${currentRowNum}/${rowCount + 1} due to missing essential data`);
      return;
    }

    console.log(`Processing row ${currentRowNum}/${rowCount + 1}: ${row.Listing_Title}`);

    try {
      const roomCount = parseInt(row.Bedrooms) || 1;
      const bathroomCount = parseFloat(row.Bathrooms) || 1;
      const squareFootage = parseInt(row.Square_Footage) || 400;
      const shortestLeasePrice = Math.floor(Math.random() * (7500 - 800 + 1)) + 800;
      const longestLeasePrice = Math.floor(shortestLeasePrice * 0.85);
      const longestLeaseLength = Math.floor(Math.random() * 12) + 1;
      const shortestLeaseLength = 1; const mainImageUrl = row.Main_Image_URL;

      if (!mainImageUrl || !mainImageUrl.startsWith('http')) {
        console.warn(`Skipping row ${currentRowNum} due to invalid Main_Image_URL: ${mainImageUrl}`);
        return;
      }

      const listingImagesCreate = [{ url: mainImageUrl, rank: 1 }];
      for (let j = 1; j <= 7; j++) {
        const imageUrl = row[`Image_URL_${j}`];
        if (imageUrl && imageUrl.startsWith('http')) {
          listingImagesCreate.push({ url: imageUrl, rank: j + 1 });
        }
      }

      const bedroomsCreate = Array(roomCount)
        .fill()
        .map((_, index) => ({
          bedroomNumber: index + 1,
          bedType: 'Queen',
        }));

      const descriptionLower = row.Description.toLowerCase();
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

      const newListing = await prisma.listing.create({
        data: {
          title: row.Listing_Title,
          description: row.Description,
          imageSrc: mainImageUrl,
          roomCount: roomCount,
          bathroomCount: bathroomCount,
          squareFootage: squareFootage,
          userId: 'clw71k4ot0000txv15h7l7xmf',
          furnished: true,
          kitchen: true,
          privateBathroom: true,
          listingImages: {
            create: listingImagesCreate,
          },
          bedrooms: {
            create: bedroomsCreate,
          },
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
          status: 'pending',
          category: 'Apartment',
          shortestLeasePrice,
          shortestLeaseLength,
          longestLeasePrice,
          longestLeaseLength,
          latitude:0,
          longitude:0,
          locationString: 'tbd',
        },
      });

      processedCount++;
      console.log(`Created listing for row ${currentRowNum}/${rowCount + 1}: ${newListing.title} (ID: ${newListing.id})`);

      await completedRowsWriter.writeRecords([{ completedRow: currentRowNum }]);

    } catch (error) {
      console.error(`Error processing row ${currentRowNum}/${rowCount + 1} - ${row.Listing_Title}:`, error);
    }
  });

  readStream.on('end', async () => {
    console.log(`Processing complete. Processed ${processedCount} out of ${rowCount} rows.`);
    await prisma.$disconnect();
  });

  readStream.on('error', async (error) => {
    console.error('Error reading CSV stream:', error);
    await prisma.$disconnect();
  });
}

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

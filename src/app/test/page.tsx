import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import generateRandomListings from '../utils/seed';
import { currentUser } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

async function generateListings(formData: FormData) {
  'use server'
  
  const count = Number(formData.get('count')) || 200;
  let user = await currentUser();
  
  try {
    const listings = generateRandomListings(count);
    let createdCount = 0;
    
    for (const listing of listings) {
      // Ensure the listing data matches the Prisma model
      const sanitizedListing = {
        ...listing,
        userId: user.id, // Replace with a valid user ID or generate dynamically
        status: 'available',
        latitude: listing.latitude || 0,
        longitude: listing.longitude || 0,
        squareFootage: listing.squareFootage || 0,
        shortestLeaseLength: listing.shortestLeaseLength || 1,
        longestLeaseLength: listing.longestLeaseLength || 12,
        shortestLeasePrice: listing.shortestLeasePrice || 4000,
        longestLeasePrice: listing.longestLeasePrice || 3500,
        listingImages: {
          create: generateListingImages(20), // Generate 3 images per listing
        },
        bedrooms: {
          create: generateBedrooms(listing.roomCount), // Generate bedrooms based on roomCount
        },
      };

      await prisma.listing.create({
        data: sanitizedListing,
      });
      createdCount++;
      console.log(`Created listing ${createdCount} of ${listings.length}`);
    }
    
    console.log(`Finished creating ${createdCount} listings`);
    revalidatePath('/listings'); // Adjust the path as needed
    return `Successfully generated and saved ${createdCount} listings!`;
  } catch (error) {
    console.error('Error generating listings:', error);
    return `Error: ${error.message}`;
  }
}

function generateListingImages(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    url: `/placeholderImages/image_${Math.floor(Math.random() * 30) + 1}.jpg`,
    category: getRandomElement(['General', 'Bedroom', 'Kitchen', 'Bathroom', 'Exterior']),
    rank: index,
  }));
}

function generateBedrooms(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    bedType: getRandomElement(['twin', 'full', 'queen', 'king']),
    bedroomNumber: index + 1,
  }));
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export default function GenerateListings() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Random Listings</h1>
      <form action={generateListings}>
        <div className="mb-4">
          <label htmlFor="count" className="block mb-2">Number of listings to generate:</label>
          <input
            type="number"
            id="count"
            name="count"
            defaultValue={200}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Generate and Save Listings
        </button>
      </form>
    </div>
  );
}

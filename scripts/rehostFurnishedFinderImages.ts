import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FURNISHED_FINDER_DOMAIN = 'https://www.furnishedfinder.com/';
// Ensure this matches the URL where your Next.js app is running
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'; 
const UPLOAD_API_ENDPOINT = `${API_BASE_URL}/api/uploadthing/direct`;

// Helper function to introduce delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to call the upload API
async function rehostImage(imageUrl: string): Promise<string | null> {
  console.log(`Attempting to rehost image: ${imageUrl}`);
  try {
    const response = await fetch(`${UPLOAD_API_ENDPOINT}?fileURL=${encodeURIComponent(imageUrl)}`);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error(`API call failed for ${imageUrl}: ${response.status} ${response.statusText}`, errorBody);
      return null;
    }

    const result = await response.json();
    
    // Assuming the API returns an object with a 'data' property containing the new URL info
    // Adjust this based on the actual structure returned by your API endpoint
    // Example structure: { data: { url: 'new_url' } } or [{ data: { url: 'new_url' } }]
    let newUrl: string | undefined;
    if (Array.isArray(result) && result.length > 0 && result[0].data?.url) {
        newUrl = result[0].data.url;
    } else if (result.data?.url) {
        newUrl = result.data.url;
    } else {
        console.error(`Unexpected API response structure for ${imageUrl}:`, result);
        return null;
    }

    console.log(`Successfully rehosted ${imageUrl} to ${newUrl}`);
    // Ensure we return null if newUrl is undefined to match the function signature
    return newUrl ?? null; 

  } catch (error) {
    console.error(`Error calling upload API for ${imageUrl}:`, error);
    return null;
  }
}

async function main() {
  console.log('Starting script to rehost Furnished Finder images...');

  try {
    const listings = await prisma.listing.findMany({
      where: {
        latitude: {
          not: 0,
        },
      },
      include: {
        listingImages: true, // Include related images
      },
    });

    console.log(`Found ${listings.length} listings with non-zero latitude.`);

    for (const listing of listings) {
      console.log(`Processing listing ID: ${listing.id}`);

      // Process the main imageSrc
      if (listing.imageSrc && listing.imageSrc.startsWith(FURNISHED_FINDER_DOMAIN)) {
        console.log(`Found Furnished Finder imageSrc: ${listing.imageSrc}`);
        const newImageUrl = await rehostImage(listing.imageSrc);
        if (newImageUrl) {
          try {
            await prisma.listing.update({
              where: { id: listing.id },
              data: { imageSrc: newImageUrl },
            });
            console.log(`Updated imageSrc for listing ${listing.id}`);
          } catch (dbError) {
            console.error(`Failed to update imageSrc for listing ${listing.id}:`, dbError);
          }
        } else {
          console.warn(`Skipping imageSrc update for listing ${listing.id} due to rehosting failure.`);
        }
        await delay(1000); // Wait 1 second before the next potential upload
      } else if (listing.imageSrc) {
         console.log(`Listing ${listing.id} imageSrc is not from Furnished Finder: ${listing.imageSrc}`);
      } else {
         console.log(`Listing ${listing.id} has no imageSrc.`);
      }


      // Process listingImages
      if (listing.listingImages && listing.listingImages.length > 0) {
        console.log(`Processing ${listing.listingImages.length} additional images for listing ${listing.id}`);
        for (const image of listing.listingImages) {
          if (image.url && image.url.startsWith(FURNISHED_FINDER_DOMAIN)) {
            console.log(`Found Furnished Finder listingImage URL: ${image.url}`);
            const newImageUrl = await rehostImage(image.url);
            if (newImageUrl) {
              try {
                await prisma.listingImage.update({
                  where: { id: image.id },
                  data: { url: newImageUrl },
                });
                console.log(`Updated URL for listingImage ${image.id}`);
              } catch (dbError) {
                console.error(`Failed to update URL for listingImage ${image.id}:`, dbError);
              }
            } else {
              console.warn(`Skipping listingImage update for image ${image.id} due to rehosting failure.`);
            }
            await delay(1000); // Wait 1 second before the next upload
          } else {
             console.log(`ListingImage ${image.id} URL is not from Furnished Finder: ${image.url}`);
          }
        }
      } else {
         console.log(`Listing ${listing.id} has no additional listingImages.`);
      }
       console.log(`Finished processing listing ID: ${listing.id}`);
    }

    console.log('Script finished processing all listings.');

  } catch (error) {
    console.error('An error occurred during script execution:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

main();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserFavorites() {
  console.log('\n=== Checking User Favorites ===\n');

  // Find Taylor Bent
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { firstName: 'Taylor', lastName: 'Bent' },
        { email: { contains: 'taylor' } },
      ]
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    }
  });

  if (!user) {
    console.log('❌ User "Taylor Bent" not found!');
    console.log('\nSearching for users with "taylor" in email or name...');
    
    const similarUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'taylor' } },
          { firstName: { contains: 'taylor' } },
          { lastName: { contains: 'bent' } },
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      take: 10,
    });

    if (similarUsers.length > 0) {
      console.log('\nFound similar users:');
      similarUsers.forEach((u, i) => {
        console.log(`${i + 1}. ${u.firstName} ${u.lastName} (${u.email})`);
      });
    }
    
    await prisma.$disconnect();
    return;
  }

  console.log('--- User Info ---');
  console.log(`Name: ${user.firstName} ${user.lastName}`);
  console.log(`Email: ${user.email}`);
  console.log(`User ID: ${user.id}`);

  // Get all trips for this user
  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    include: {
      favorites: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n--- User Trips: ${trips.length} ---`);

  // Get all favorite IDs to fetch their listings
  const allFavoriteListingIds = trips.flatMap(trip => 
    trip.favorites.map(fav => fav.listingId).filter((id): id is string => id !== null)
  );

  // Fetch all listings in one query
  const listings = await prisma.listing.findMany({
    where: {
      id: { in: allFavoriteListingIds }
    },
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
    }
  });

  const listingsMap = new Map(listings.map(l => [l.id, l]));

  let totalFavorites = 0;
  trips.forEach((trip, index) => {
    const favCount = trip.favorites.length;
    totalFavorites += favCount;
    
    console.log(`\nTrip ${index + 1}: ${trip.locationString || 'No location'}`);
    console.log(`  Trip ID: ${trip.id}`);
    console.log(`  Created: ${trip.createdAt.toLocaleDateString()}`);
    console.log(`  Favorites: ${favCount}`);
    
    if (favCount > 0) {
      console.log(`  Favorited Listings:`);
      trip.favorites.forEach((fav, favIndex) => {
        const listing = fav.listingId ? listingsMap.get(fav.listingId) : null;
        const title = listing?.title || 'Unknown listing';
        const location = listing ? `${listing.city}, ${listing.state}` : 'Unknown location';
        console.log(`    ${favIndex + 1}. ${title} (${location})`);
      });
    }
  });

  console.log(`\n--- Summary ---`);
  console.log(`Total Trips: ${trips.length}`);
  console.log(`Total Favorites: ${totalFavorites}`);

  // Also check for any favorites without a valid listing
  const favoritesWithoutListing = await prisma.favorite.count({
    where: {
      trip: {
        userId: user.id
      },
      listingId: null
    }
  });

  // Count favorites with deleted listings by checking if listingId exists in Listing table
  const favoritesWithListingId = await prisma.favorite.findMany({
    where: {
      trip: {
        userId: user.id
      },
      listingId: { not: null }
    },
    select: {
      listingId: true
    }
  });

  const existingListingIds = new Set(listings.map(l => l.id));
  const favoritesWithDeletedListing = favoritesWithListingId.filter(
    fav => fav.listingId && !existingListingIds.has(fav.listingId)
  ).length;

  if (favoritesWithoutListing > 0 || favoritesWithDeletedListing > 0) {
    console.log(`\n--- Data Issues ---`);
    if (favoritesWithoutListing > 0) {
      console.log(`⚠️  Favorites with null listingId: ${favoritesWithoutListing}`);
    }
    if (favoritesWithDeletedListing > 0) {
      console.log(`⚠️  Favorites with deleted listings: ${favoritesWithDeletedListing}`);
    }
  }

  await prisma.$disconnect();
}

checkUserFavorites()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

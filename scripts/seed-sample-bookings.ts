import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample data that matches the frontend mock data
const sampleUsers = [
  {
    id: "user-001",
    email: "john.smith@example.com",
    firstName: "John",
    lastName: "Smith",
    imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=JS",
    role: "user"
  },
  {
    id: "user-002", 
    email: "sarah.j@example.com",
    firstName: "Sarah",
    lastName: "Johnson",
    imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=SJ",
    role: "user"
  },
  {
    id: "user-003",
    email: "m.davis@example.com", 
    firstName: "Michael",
    lastName: "Davis",
    imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=MD",
    role: "user"
  },
  {
    id: "user-004",
    email: "emily.w@example.com",
    firstName: "Emily", 
    lastName: "Wilson",
    imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=EW",
    role: "user"
  },
  {
    id: "host-001",
    email: "host@example.com",
    firstName: "Host",
    lastName: "User",
    imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=HU",
    role: "user"
  }
];

const sampleListings = [
  {
    id: "listing-001",
    userId: "host-001",
    title: "Modern Downtown Loft",
    streetAddress1: "123 Main Street",
    city: "San Francisco",
    state: "CA",
    postalCode: "94102",
    latitude: 37.7749,
    longitude: -122.4194,
    bedrooms: 2,
    bathrooms: 2,
    pricePerMonth: 4000,
    shortestLeaseLength: 3,
    longestLeaseLength: 12,
    approved: true
  },
  {
    id: "listing-002", 
    userId: "host-001",
    title: "Cozy Studio Near Park",
    streetAddress1: "456 Oak Avenue",
    city: "San Francisco",
    state: "CA", 
    postalCode: "94117",
    latitude: 37.7849,
    longitude: -122.4294,
    bedrooms: 1,
    bathrooms: 1,
    pricePerMonth: 3500,
    shortestLeaseLength: 3,
    longestLeaseLength: 12,
    approved: true
  },
  {
    id: "listing-003",
    userId: "host-001", 
    title: "Spacious 2BR Apartment",
    streetAddress1: "789 Market Street",
    city: "San Francisco",
    state: "CA",
    postalCode: "94103",
    latitude: 37.7649,
    longitude: -122.4094,
    bedrooms: 2,
    bathrooms: 2,
    pricePerMonth: 4500,
    shortestLeaseLength: 3,
    longestLeaseLength: 12,
    approved: true
  }
];

const sampleTrips = [
  {
    id: "trip-001",
    userId: "user-001",
    locationString: "San Francisco, CA",
    latitude: 37.7749,
    longitude: -122.4194,
    city: "San Francisco",
    state: "CA",
    postalCode: "94102",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-04-15"),
    numAdults: 2,
    numPets: 1,
    numChildren: 0,
    minPrice: 3000,
    maxPrice: 5000
  },
  {
    id: "trip-002",
    userId: "user-002", 
    locationString: "San Francisco, CA",
    latitude: 37.7749,
    longitude: -122.4194,
    city: "San Francisco",
    state: "CA",
    postalCode: "94117",
    startDate: new Date("2025-02-01"),
    endDate: new Date("2025-05-01"),
    numAdults: 1,
    numPets: 0,
    numChildren: 0,
    minPrice: 2500,
    maxPrice: 3500
  },
  {
    id: "trip-003",
    userId: "user-003",
    locationString: "San Francisco, CA", 
    latitude: 37.7749,
    longitude: -122.4194,
    city: "San Francisco",
    state: "CA",
    postalCode: "94103",
    startDate: new Date("2024-10-01"),
    endDate: new Date("2024-12-31"),
    numAdults: 2,
    numPets: 0,
    numChildren: 1,
    minPrice: 4000,
    maxPrice: 6000
  },
  {
    id: "trip-004",
    userId: "user-004",
    locationString: "San Francisco, CA",
    latitude: 37.7749,
    longitude: -122.4194,
    city: "San Francisco", 
    state: "CA",
    postalCode: "94102",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-31"),
    numAdults: 2,
    numPets: 2,
    numChildren: 0,
    minPrice: 3500,
    maxPrice: 4500
  }
];

const sampleMatches = [
  {
    id: "match-001",
    tripId: "trip-001",
    listingId: "listing-001",
    monthlyRent: 4000,
    paymentAuthorizedAt: new Date("2024-12-20"),
    paymentStatus: "authorized",
    tenantSignedAt: new Date("2024-12-19"),
    landlordSignedAt: new Date("2024-12-20")
  },
  {
    id: "match-002", 
    tripId: "trip-002",
    listingId: "listing-002",
    monthlyRent: 3500,
    paymentAuthorizedAt: new Date("2024-12-15"),
    paymentStatus: "authorized", 
    tenantSignedAt: new Date("2024-12-14"),
    landlordSignedAt: new Date("2024-12-15")
  },
  {
    id: "match-003",
    tripId: "trip-003",
    listingId: "listing-003", 
    monthlyRent: 4500,
    paymentAuthorizedAt: new Date("2024-09-15"),
    paymentStatus: "authorized",
    tenantSignedAt: new Date("2024-09-14"),
    landlordSignedAt: new Date("2024-09-15")
  },
  {
    id: "match-004",
    tripId: "trip-004",
    listingId: "listing-001",
    monthlyRent: 4000,
    paymentAuthorizedAt: null,
    paymentStatus: "cancelled",
    tenantSignedAt: new Date("2024-12-09"),
    landlordSignedAt: new Date("2024-12-10")
  }
];

const sampleBookings = [
  {
    id: "booking-001",
    userId: "user-001",
    listingId: "listing-001",
    tripId: "trip-001",
    matchId: "match-001",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-04-15"),
    totalPrice: 12000,
    monthlyRent: 4000,
    status: "active",
    createdAt: new Date("2024-12-20")
  },
  {
    id: "booking-002",
    userId: "user-002",
    listingId: "listing-002", 
    tripId: "trip-002",
    matchId: "match-002",
    startDate: new Date("2025-02-01"),
    endDate: new Date("2025-05-01"),
    totalPrice: 10500,
    monthlyRent: 3500,
    status: "upcoming", 
    createdAt: new Date("2024-12-15")
  },
  {
    id: "booking-003",
    userId: "user-003",
    listingId: "listing-003",
    tripId: "trip-003", 
    matchId: "match-003",
    startDate: new Date("2024-10-01"),
    endDate: new Date("2024-12-31"),
    totalPrice: 13500,
    monthlyRent: 4500,
    status: "completed",
    createdAt: new Date("2024-09-15")
  },
  {
    id: "booking-004",
    userId: "user-004",
    listingId: "listing-001",
    tripId: "trip-004",
    matchId: "match-004", 
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-31"),
    totalPrice: 4000,
    monthlyRent: 4000,
    status: "cancelled",
    createdAt: new Date("2024-12-10")
  }
];

async function main() {
  console.log('Starting to seed sample bookings...');

  try {
    // Check if data already exists
    const existingBookings = await prisma.booking.findMany({
      where: {
        id: {
          in: sampleBookings.map(b => b.id)
        }
      }
    });

    if (existingBookings.length > 0) {
      console.log(`Found ${existingBookings.length} existing sample bookings. Skipping seed.`);
      console.log('Existing booking IDs:', existingBookings.map(b => b.id));
      return;
    }

    // Create users (upsert to avoid conflicts)
    console.log('Creating users...');
    for (const user of sampleUsers) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user
      });
    }

    // Create listings (upsert to avoid conflicts)
    console.log('Creating listings...');
    for (const listing of sampleListings) {
      await prisma.listing.upsert({
        where: { id: listing.id },
        update: {},
        create: listing
      });
    }

    // Create trips (upsert to avoid conflicts)
    console.log('Creating trips...');
    for (const trip of sampleTrips) {
      await prisma.trip.upsert({
        where: { id: trip.id },
        update: {},
        create: trip
      });
    }

    // Create matches (upsert to avoid conflicts)
    console.log('Creating matches...');
    for (const match of sampleMatches) {
      await prisma.match.upsert({
        where: { id: match.id },
        update: {},
        create: match
      });
    }

    // Create bookings (upsert to avoid conflicts)
    console.log('Creating bookings...');
    for (const booking of sampleBookings) {
      await prisma.booking.upsert({
        where: { id: booking.id },
        update: {},
        create: booking
      });
    }

    console.log('Successfully seeded sample bookings!');
    console.log(`Created ${sampleUsers.length} users, ${sampleListings.length} listings, ${sampleTrips.length} trips, ${sampleMatches.length} matches, and ${sampleBookings.length} bookings.`);

  } catch (error) {
    console.error('Error seeding sample bookings:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying sample bookings...');

  try {
    // Check bookings with relations
    const bookings = await prisma.booking.findMany({
      where: {
        id: {
          startsWith: "booking-"
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress1: true,
            city: true,
            state: true
          }
        },
        trip: {
          select: {
            id: true,
            numAdults: true,
            numChildren: true,
            numPets: true
          }
        },
        match: {
          select: {
            id: true,
            monthlyRent: true,
            paymentStatus: true
          }
        }
      }
    });

    console.log(`\nFound ${bookings.length} sample bookings:`);
    
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking ${booking.id}:`);
      console.log(`   - Status: ${booking.status}`);
      console.log(`   - User: ${booking.user?.firstName} ${booking.user?.lastName} (${booking.user?.email})`);
      console.log(`   - Listing: ${booking.listing?.title} - ${booking.listing?.streetAddress1}, ${booking.listing?.city}, ${booking.listing?.state}`);
      console.log(`   - Dates: ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}`);
      console.log(`   - Monthly Rent: $${booking.monthlyRent?.toLocaleString()}`);
      console.log(`   - Trip: ${booking.trip?.numAdults} adults, ${booking.trip?.numChildren} children, ${booking.trip?.numPets} pets`);
      console.log(`   - Match Payment Status: ${booking.match?.paymentStatus}`);
    });

    // Check that we can access bookings by listing owner
    const hostUser = await prisma.user.findUnique({
      where: { id: "host-001" }
    });

    if (hostUser) {
      console.log(`\nHost user: ${hostUser.firstName} ${hostUser.lastName} (${hostUser.email})`);
      
      const hostListings = await prisma.listing.findMany({
        where: { userId: "host-001" },
        include: {
          bookings: {
            include: {
              user: true
            }
          }
        }
      });

      console.log(`\nHost has ${hostListings.length} listings with bookings:`);
      hostListings.forEach(listing => {
        console.log(`  - ${listing.title}: ${listing.bookings.length} bookings`);
      });
    }

    console.log('\n✅ Sample bookings verification completed successfully!');

  } catch (error) {
    console.error('❌ Error verifying sample bookings:', error);
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
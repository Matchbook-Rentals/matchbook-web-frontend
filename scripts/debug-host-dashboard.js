const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugHostDashboard() {
  try {
    console.log('🔍 Debugging Host Dashboard Data...\n');

    // 1. Check all bookings and their associated host user IDs
    console.log('1️⃣ ALL BOOKINGS WITH HOST USER IDS:');
    const allBookings = await prisma.booking.findMany({
      include: {
        listing: {
          select: {
            userId: true,
            title: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${allBookings.length} total bookings:`);
    allBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. Booking: ${booking.id}`);
      console.log(`     Host User ID: ${booking.listing?.userId}`);
      console.log(`     Listing: ${booking.listing?.title}`);
      console.log(`     Tenant: ${booking.user?.firstName} ${booking.user?.lastName}`);
      console.log(`     Status: ${booking.status}`);
      console.log('');
    });

    // 2. Check unique host user IDs
    console.log('2️⃣ UNIQUE HOST USER IDS WITH BOOKINGS:');
    const uniqueHosts = [...new Set(allBookings.map(b => b.listing?.userId).filter(Boolean))];
    console.log('Host user IDs:', uniqueHosts);

    // 3. For each host, show what getAllHostBookings would return
    console.log('\n3️⃣ SIMULATING getAllHostBookings FOR EACH HOST:');
    for (const hostUserId of uniqueHosts) {
      console.log(`\n📋 Host: ${hostUserId}`);
      
      // Simulate getAllHostBookings logic
      const hostBookings = await prisma.booking.findMany({
        where: { 
          listing: {
            userId: hostUserId
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            select: {
              title: true,
              imageSrc: true,
              streetAddress1: true,
              city: true,
              state: true,
              postalCode: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          trip: {
            select: {
              numAdults: true,
              numPets: true,
              numChildren: true
            }
          }
        }
      });

      // Get ready matches for this host
      const readyMatches = await prisma.match.findMany({
        where: {
          AND: [
            { paymentAuthorizedAt: { not: null } },
            { booking: null },
            {
              BoldSignLease: {
                tenantSigned: true
              }
            },
            {
              listing: {
                userId: hostUserId
              }
            }
          ]
        },
        orderBy: { paymentAuthorizedAt: 'desc' },
        include: {
          trip: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          listing: {
            select: {
              title: true,
              imageSrc: true,
              streetAddress1: true,
              city: true,
              state: true,
              postalCode: true
            }
          },
          BoldSignLease: true,
          Lease: true
        }
      });

      console.log(`  Bookings: ${hostBookings.length}`);
      console.log(`  Ready Matches: ${readyMatches.length}`);
      
      if (hostBookings.length > 0) {
        console.log('  Booking details:');
        hostBookings.forEach((booking, i) => {
          console.log(`    ${i + 1}. ${booking.id} - ${booking.listing?.title} - $${booking.monthlyRent}`);
        });
      }
    }

    // 4. Check the current issue - what if the dashboard user is someone else?
    console.log('\n4️⃣ CHECKING FOR POTENTIAL AUTH USER MISMATCH:');
    
    // Get all user IDs from the system to see who might be the authenticated user
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      },
      take: 20 // Limit to first 20 users
    });

    console.log('User IDs in the system:');
    allUsers.forEach((user, index) => {
      const hasBookings = uniqueHosts.includes(user.id);
      console.log(`  ${index + 1}. ${user.id} - ${user.firstName} ${user.lastName} (${user.email}) ${hasBookings ? '✅ HAS BOOKINGS' : '❌ NO BOOKINGS'}`);
    });

    // 5. Check listings ownership
    console.log('\n5️⃣ LISTING OWNERSHIP ANALYSIS:');
    const listingCounts = await prisma.listing.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    console.log('Listings per user:');
    listingCounts.forEach((count, index) => {
      const hasBookings = uniqueHosts.includes(count.userId);
      console.log(`  ${index + 1}. User ${count.userId}: ${count._count.id} listings ${hasBookings ? '✅ HAS BOOKINGS' : '❌ NO BOOKINGS'}`);
    });

    // 6. The mystery: If the dashboard shows 101 listings but 0 bookings
    console.log('\n6️⃣ MYSTERY ANALYSIS - User with 101 listings:');
    const userWith101Listings = listingCounts.find(c => c._count.id === 101);
    if (userWith101Listings) {
      console.log(`User with 101 listings: ${userWith101Listings.userId}`);
      
      // Check if this user has any bookings
      const bookingsFor101User = await prisma.booking.findMany({
        where: {
          listing: {
            userId: userWith101Listings.userId
          }
        }
      });
      
      console.log(`Bookings for user with 101 listings: ${bookingsFor101User.length}`);
      
      if (bookingsFor101User.length === 0) {
        console.log('🎯 FOUND THE ISSUE: The authenticated user has 101 listings but 0 bookings!');
        console.log('   This means the dashboard is working correctly - this user just has no bookings yet.');
      }
    }

  } catch (error) {
    console.error('❌ Error debugging dashboard:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
if (require.main === module) {
  debugHostDashboard()
    .then(() => {
      console.log('\n🎉 Debug completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugHostDashboard };
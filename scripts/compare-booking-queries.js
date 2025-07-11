const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function compareBookingQueries() {
  try {
    console.log('🔍 Comparing booking queries...\n');

    // 1. Direct database query for all bookings
    console.log('1️⃣ DIRECT DB QUERY - All Bookings:');
    const directBookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            title: true,
            imageSrc: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true,
            userId: true // Include to see which host owns it
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

    console.log(`Found ${directBookings.length} total bookings in database`);
    directBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. Booking ID: ${booking.id}`);
      console.log(`     Match ID: ${booking.matchId}`);
      console.log(`     Listing: ${booking.listing?.title} (Host: ${booking.listing?.userId})`);
      console.log(`     Tenant: ${booking.user?.firstName} ${booking.user?.lastName}`);
      console.log(`     Status: ${booking.status}`);
      console.log(`     Dates: ${booking.startDate} to ${booking.endDate}`);
      console.log(`     Monthly Rent: $${booking.monthlyRent}`);
      console.log('');
    });

    // 2. Simulate getAllHostBookings function (without auth)
    console.log('\n2️⃣ SIMULATED getAllHostBookings FUNCTION:');
    
    // Get all unique host user IDs from listings that have bookings
    const hostsWithBookings = await prisma.listing.findMany({
      where: {
        bookings: {
          some: {}
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    console.log(`Found ${hostsWithBookings.length} hosts with bookings`);

    for (const host of hostsWithBookings) {
      console.log(`\n📋 Host ${host.userId}:`);
      
      // Run the equivalent of getAllHostBookings for this host
      const hostBookings = await prisma.booking.findMany({
        where: { 
          listing: {
            userId: host.userId
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
          },
        }
      });

      // Also get ready matches (matches ready to become bookings)
      const readyMatches = await prisma.match.findMany({
        where: {
          AND: [
            { paymentAuthorizedAt: { not: null } }, // Payment is authorized
            { booking: null }, // No booking exists yet
            {
              BoldSignLease: {
                tenantSigned: true // Tenant has signed
              }
            },
            {
              listing: {
                userId: host.userId // Only matches for listings owned by this host
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

      console.log(`  📊 Bookings: ${hostBookings.length}`);
      hostBookings.forEach((booking, index) => {
        console.log(`    ${index + 1}. ${booking.id} - ${booking.listing?.title} - $${booking.monthlyRent}/month`);
      });

      console.log(`  🏠 Ready Matches (should become bookings): ${readyMatches.length}`);
      readyMatches.forEach((match, index) => {
        console.log(`    ${index + 1}. Match ${match.id} - ${match.listing?.title} - $${match.monthlyRent}/month`);
        console.log(`       Payment: ${match.paymentStatus} (${match.paymentAuthorizedAt})`);
        console.log(`       BoldSignLease: tenant=${match.BoldSignLease?.tenantSigned}, landlord=${match.BoldSignLease?.landlordSigned}`);
      });
    }

    // 3. Check for completed matches that should be bookings but aren't (the original bug)
    console.log('\n3️⃣ MATCHES THAT SHOULD BE BOOKINGS (Regular Lease Signatures):');
    
    const missedMatches = await prisma.match.findMany({
      where: {
        AND: [
          { paymentAuthorizedAt: { not: null } }, // Payment is authorized
          { paymentStatus: 'succeeded' }, // Payment completed
          { booking: null }, // No booking exists yet
          { landlordSignedAt: { not: null } }, // Landlord signed (regular lease)
          { tenantSignedAt: { not: null } }, // Tenant signed (regular lease)
        ]
      },
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
            userId: true
          }
        }
      }
    });

    console.log(`Found ${missedMatches.length} completed matches without bookings (regular lease signatures)`);
    missedMatches.forEach((match, index) => {
      console.log(`  ${index + 1}. Match ${match.id}`);
      console.log(`     Listing: ${match.listing?.title} (Host: ${match.listing?.userId})`);
      console.log(`     Tenant: ${match.trip?.user?.firstName} ${match.trip?.user?.lastName}`);
      console.log(`     Payment: ${match.paymentStatus} (authorized: ${match.paymentAuthorizedAt})`);
      console.log(`     Signatures: landlord=${match.landlordSignedAt}, tenant=${match.tenantSignedAt}`);
      console.log(`     Monthly Rent: $${match.monthlyRent}`);
      console.log('');
    });

    // 4. Summary comparison
    console.log('\n📊 SUMMARY COMPARISON:');
    console.log(`Total bookings in database: ${directBookings.length}`);
    console.log(`Completed matches missing bookings: ${missedMatches.length}`);
    console.log(`Expected total bookings: ${directBookings.length + missedMatches.length}`);

    if (missedMatches.length > 0) {
      console.log('\n⚠️  ISSUE: getAllHostBookings will miss these completed matches because:');
      console.log('   - It only looks for BoldSignLease completions');
      console.log('   - It ignores matches with regular lease signatures (landlordSignedAt/tenantSignedAt)');
      console.log('   - These matches should automatically become bookings');
    }

  } catch (error) {
    console.error('❌ Error comparing queries:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comparison
if (require.main === module) {
  compareBookingQueries()
    .then(() => {
      console.log('\n🎉 Comparison completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Comparison failed:', error);
      process.exit(1);
    });
}

module.exports = { compareBookingQueries };
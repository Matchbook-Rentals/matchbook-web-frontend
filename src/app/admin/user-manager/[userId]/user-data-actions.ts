import prisma from '@/lib/prismadb'

export async function getUserData(userId: string) {
  console.log('🔍 [getUserData] Starting fetch for userId:', userId)
  
  try {
    // First, verify the user exists in our database
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    })
    
    console.log('👤 [getUserData] User exists check:', userExists ? 'YES' : 'NO', userExists)
    
    if (!userExists) {
      console.error('❌ [getUserData] User not found in database with ID:', userId)
      return {
        error: 'User not found in database',
        bookings: [],
        trips: [],
        listings: [],
        housingRequests: [],
        matches: [],
        favorites: []
      }
    }
    
    // Fetch user's renter bookings (user booked someone else's listing)
    console.log('🏃 [getUserData] Fetching renter bookings...')
    const renterBookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress1: true,
            city: true,
            state: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        trip: {
          select: {
            id: true,
            locationString: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log('🏃 [getUserData] Found', renterBookings.length, 'renter bookings')

    // Fetch user's host bookings (someone booked user's listing)
    console.log('🏡 [getUserData] Fetching host bookings...')
    const hostBookings = await prisma.booking.findMany({
      where: { 
        listing: {
          userId: userId
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
            locationString: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log('🏡 [getUserData] Found', hostBookings.length, 'host bookings')

    // Fetch user's trips (searches)
    console.log('🎯 [getUserData] Fetching trips...')
    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    console.log('🎯 [getUserData] Found', trips.length, 'trips')

    // Fetch user's listings
    console.log('🏠 [getUserData] Fetching listings...')
    const listings = await prisma.listing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    console.log('🏠 [getUserData] Found', listings.length, 'listings')

    // Fetch user's housing requests (applications)
    console.log('📄 [getUserData] Fetching housing requests...')
    const housingRequests = await prisma.housingRequest.findMany({
      where: { userId },
      include: {
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
            locationString: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log('📄 [getUserData] Found', housingRequests.length, 'housing requests')

    // Fetch user's matches
    console.log('💕 [getUserData] Fetching matches...')
    const matches = await prisma.match.findMany({
      where: {
        trip: {
          userId: userId
        }
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress1: true,
            city: true,
            state: true,
            shortestLeasePrice: true,
            longestLeasePrice: true
          }
        },
        trip: {
          select: {
            id: true,
            locationString: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { tripId: 'desc' }
    })
    console.log('💕 [getUserData] Found', matches.length, 'matches')

    // Fetch user's favorites
    console.log('⭐ [getUserData] Fetching favorites...')
    const favorites = await prisma.favorite.findMany({
      where: {
        trip: {
          userId: userId
        }
      },
      include: {
        trip: {
          select: {
            id: true,
            locationString: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log('⭐ [getUserData] Found', favorites.length, 'favorites')

    const result = {
      renterBookings: renterBookings,
      hostBookings: hostBookings,
      trips: trips,
      listings: listings,
      housingRequests: housingRequests,
      matches: matches,
      favorites: favorites
    }
    
    const totalCounts = {
      renterBookings: result.renterBookings.length,
      hostBookings: result.hostBookings.length,
      trips: result.trips.length, 
      listings: result.listings.length,
      housingRequests: result.housingRequests.length,
      matches: result.matches.length,
      favorites: result.favorites.length
    }
    
    console.log('✅ [getUserData] Final counts:', totalCounts)
    
    return result
    
  } catch (error) {
    console.error('❌ [getUserData] Database error for userId', userId, ':', error)
    
    // Re-throw the error so it's visible in the UI
    throw new Error(`Failed to fetch user data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
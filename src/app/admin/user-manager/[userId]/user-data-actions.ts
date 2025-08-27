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
      renterBookings: renterBookings.map(booking => ({
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalAmount: booking.totalAmount,
        listing: booking.listing,
        trip: booking.trip,
        createdAt: booking.createdAt,
        type: 'renter' as const
      })),
      hostBookings: hostBookings.map(booking => ({
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalAmount: booking.totalAmount,
        listing: booking.listing,
        trip: booking.trip,
        renter: booking.user,
        createdAt: booking.createdAt,
        type: 'host' as const
      })),
      trips: trips.map(trip => ({
        id: trip.id,
        locationString: trip.locationString,
        city: trip.city,
        state: trip.state,
        startDate: trip.startDate,
        endDate: trip.endDate,
        minPrice: trip.minPrice,
        maxPrice: trip.maxPrice,
        minBeds: trip.minBeds,
        minBedrooms: trip.minBedrooms,
        minBathrooms: trip.minBathrooms,
        numAdults: trip.numAdults,
        numPets: trip.numPets,
        numChildren: trip.numChildren,
        tripStatus: trip.tripStatus,
        furnished: trip.furnished,
        petsAllowed: trip.petsAllowed,
        createdAt: trip.createdAt
      })),
      listings: listings.map(listing => ({
        id: listing.id,
        title: listing.title,
        streetAddress1: listing.streetAddress1,
        city: listing.city,
        state: listing.state,
        shortestLeasePrice: listing.shortestLeasePrice,
        longestLeasePrice: listing.longestLeasePrice,
        status: listing.status,
        roomCount: listing.roomCount,
        bathroomCount: listing.bathroomCount,
        createdAt: listing.createdAt
      })),
      housingRequests: housingRequests.map(request => ({
        id: request.id,
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate,
        listing: request.listing,
        trip: request.trip,
        submittedAt: request.createdAt
      })),
      matches: matches.map(match => ({
        id: match.id,
        monthlyRent: match.monthlyRent,
        paymentStatus: match.paymentStatus,
        tenantSignedAt: match.tenantSignedAt,
        landlordSignedAt: match.landlordSignedAt,
        listing: {
          ...match.listing,
          price: match.listing.shortestLeasePrice // Use shortestLeasePrice as the display price
        },
        trip: match.trip,
        matchScore: 85 // Mock match score - you could calculate this based on criteria
      })),
      favorites: favorites.map(favorite => ({
        id: favorite.id,
        rank: favorite.rank,
        trip: favorite.trip,
        createdAt: favorite.createdAt
      }))
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
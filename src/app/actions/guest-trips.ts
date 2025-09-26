'use server'

interface GuestTripData {
  locationString: string;
  latitude: number;
  longitude: number;
  startDate?: Date | null;
  endDate?: Date | null;
  numAdults?: number;
  numChildren?: number;
  numPets?: number;
}

interface GuestTripResponse {
  success: boolean;
  sessionId?: string;
  redirectUrl?: string;
  error?: string;
}

export async function createGuestTrip(tripData: GuestTripData): Promise<GuestTripResponse> {
  try {
    // Generate unique session ID
    const sessionId = crypto.randomUUID();

    // Handle date logic (same as authenticated version)
    let { startDate, endDate } = tripData;
    const today = new Date();

    if (!startDate && !endDate) {
      // If neither date is provided, start next month and end the month after
      startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    } else if (startDate && !endDate) {
      // If only start date is provided, end date is start date + 1 month
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (!startDate && endDate) {
      // If only end date is provided, start date is end date - 1 month
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Create guest session data (to be stored client-side)
    const guestSession = {
      id: sessionId,
      searchParams: {
        location: tripData.locationString,
        lat: tripData.latitude,
        lng: tripData.longitude,
        startDate,
        endDate,
        guests: {
          adults: tripData.numAdults || 1,
          children: tripData.numChildren || 0,
          pets: tripData.numPets || 0,
        },
      },
      pendingActions: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    // Return session data for client-side storage and redirect URL
    return {
      success: true,
      sessionId,
      redirectUrl: `/guest/rent/searches/${sessionId}`,
    };
  } catch (error) {
    console.error('Error creating guest trip:', error);
    return {
      success: false,
      error: 'Failed to create guest trip',
    };
  }
}
'use server'

import { createGuestSession } from './guest-session-db';

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
    // Parse location to extract city and state
    const locationArray = tripData.locationString.split(',');
    const city = locationArray[0]?.trim();
    const state = locationArray[locationArray.length - 1]?.trim();

    // Create guest session in database
    const sessionResult = await createGuestSession({
      locationString: tripData.locationString,
      latitude: tripData.latitude,
      longitude: tripData.longitude,
      city,
      state,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      numAdults: tripData.numAdults,
      numChildren: tripData.numChildren,
      numPets: tripData.numPets,
    });

    if (!sessionResult.success || !sessionResult.sessionId) {
      return {
        success: false,
        error: sessionResult.error || 'Failed to create guest session',
      };
    }

    // Return session data for client-side storage and redirect URL
    return {
      success: true,
      sessionId: sessionResult.sessionId,
      redirectUrl: `/guest/rent/searches/${sessionResult.sessionId}`,
    };
  } catch (error) {
    console.error('Error creating guest trip:', error);
    return {
      success: false,
      error: 'Failed to create guest trip',
    };
  }
}
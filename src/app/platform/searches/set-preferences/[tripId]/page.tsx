import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getTripById, updateTripFilters } from '@/app/actions/trips';
import SetPreferencesClient from './set-preferences-client';

interface PreferencesData {
  minPrice: number | null;
  maxPrice: number | null;
  furnished: boolean;
  unfurnished: boolean;
  utilitiesIncluded: boolean;
  singleFamily: boolean;
  apartment: boolean;
  privateRoom: boolean;
  townhouse: boolean;
  minBedrooms: number | null;
  minBathrooms: number | null;
}

export default async function SetPreferencesPage({ params }: { params: { tripId: string } }) {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const tripId = params.tripId;
  
  // Verify the trip belongs to the current user
  const trip = await getTripById(tripId);
  
  if (!trip || trip.userId !== userId) {
    // Trip doesn't exist or doesn't belong to the current user
    redirect('/platform/trips');
  }

  // Server action to update trip preferences
  async function updatePreferences(data: PreferencesData) {
    'use server';
    
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }
    
    // Verify the trip belongs to the current user again
    const trip = await getTripById(tripId);
    
    if (!trip || trip.userId !== userId) {
      throw new Error('Not authorized to update this trip');
    }
    
    // Update the trip with new preferences
    await updateTripFilters(tripId, data);
    
    // Redirect to the trip page
    return { success: true, tripId };
  }

  return <SetPreferencesClient tripId={tripId} updatePreferences={updatePreferences} />;
}
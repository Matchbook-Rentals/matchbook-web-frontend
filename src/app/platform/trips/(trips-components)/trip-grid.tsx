'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import TripCard from './trip-card';
import { Trip } from '@prisma/client';
import { deleteTrip } from '@/app/actions/trips';
import { useToast } from '@/components/ui/use-toast';

interface TripGridProps {
  initialTrips: Trip[];
}

const TripGrid: React.FC<TripGridProps> = ({ initialTrips }) => {
  const [trips, setTrips] = useState(initialTrips);
  const [deletingTrips, setDeletingTrips] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const handleDelete = async (tripId: string) => {
    try {
      // Track that this trip is being deleted
      setDeletingTrips(prev => new Set(prev).add(tripId));

      // Optimistic update
      const tripToDelete = trips.find(t => t.id === tripId);
      setTrips(trips.filter(trip => trip.id !== tripId));

      // Use server action
      const result = await deleteTrip(tripId);

      if (!result.success) {
        throw new Error('Failed to delete trip');
      }

      // Success! Show toast and clean up
      toast({
        title: `Trip to ${tripToDelete?.locationString} deleted`,
        variant: "warning",
      });
      setDeletingTrips(prev => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    } catch (error) {
      // Show error toast
      toast({
        title: 'Failed to delete trip',
        variant: "destructive",
      });
      // Restore only this specific trip if deletion failed
      setTrips(prev => {
        const tripToRestore = initialTrips.find(t => t.id === tripId);
        return tripToRestore ? [...prev, tripToRestore] : prev;
      });
      setDeletingTrips(prev => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {trips.map((trip) => (
        <Link
          href={`/platform/trips/${trip.id}?tab=matchmaker`}
          key={trip.id}
          className="block hover:no-underline"
        >
          <TripCard
            city={trip?.city || trip.locationString.split(',')[0]}
            state={trip?.state || trip.locationString.split(',')[1]?.trim()}
            startDate={trip.startDate?.toLocaleDateString()}
            endDate={trip.endDate?.toLocaleDateString()}
            tripId={trip.id}
            onDelete={handleDelete}
          />
        </Link>
      ))}
    </div>
  );
};

export default TripGrid;

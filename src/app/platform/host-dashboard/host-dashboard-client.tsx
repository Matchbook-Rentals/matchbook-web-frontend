'use client';

import React from 'react';
import PropertyList from './property-list';
import { Listing, ListingImage } from '@prisma/client';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useHostProperties } from '@/contexts/host-properties-provider';
import LoadingSpinner from '@/components/ui/spinner';

const HostDashboardClient: React.FC = () => {
  const { listings } = useHostProperties();
  
  // Handle empty state
  if (!listings || listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-gray-600">
        <p className="text-lg">No properties found</p>
        <p>Add your first property to get started!</p>
      </div>
    );
  }
  
  // Group properties by status
  const rented = listings.filter(p => p.status === "rented");
  const booked = listings.filter(p => p.status === "booked");
  const available = listings.filter(p => p.status === "available");

  return (
    <Accordion type="multiple" className="w-full space-y-4">
      <AccordionItem value="rented">
        <AccordionTrigger>Rented</AccordionTrigger>
        <AccordionContent>
          <PropertyList properties={rented} filter="RENTED" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="booked">
        <AccordionTrigger>Booked</AccordionTrigger>
        <AccordionContent>
          <PropertyList properties={booked} filter="BOOKED" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="available">
        <AccordionTrigger>Available</AccordionTrigger>
        <AccordionContent>
          <PropertyList properties={available} filter="AVAILABLE" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default HostDashboardClient;


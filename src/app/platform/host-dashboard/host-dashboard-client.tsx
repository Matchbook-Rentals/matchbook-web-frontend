'use client';

import React from 'react';
import PropertyList from './property-list';
import { Listing, ListingImage } from '@prisma/client';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface HostDashboardClientProps {
  properties: (Listing & { listingImages: ListingImage[] })[];
}

const HostDashboardClient: React.FC<HostDashboardClientProps> = ({ properties }) => {
  // Group properties by status
  const rented = properties.filter(p => p.status === "rented");
  const booked = properties.filter(p => p.status === "booked");
  const available = properties.filter(p => p.status === "available");

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


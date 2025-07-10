
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrossIcon } from 'lucide-react';
import { amenities } from '@/lib/amenities-list';
import { CardCarousel } from '@/components/ui/card-carousel';

interface AmenityCardsProps {
  amenities: string[];
}

const AmenityCards: React.FC<AmenityCardsProps> = ({ amenities }) => {
  const cards = amenities.map((label, idx) => (
    <Card key={`amenity-card ${idx} - `} className='flex flex-col w-[175px] h-[250px]'>
      <CardTitle className="flex text-xl text-center justify-center items-center gap-2  px-3 h-1/3">
        {label}
      </CardTitle>
      <CardContent className='border-t-2 flex justify-center items-center pt-4 h-2/3'>
        <CrossIcon name="placeholder" /> {/* Replace with appropriate icon */}
      </CardContent>
    </Card>
  ));

  // Render the component
  return (
      <CardCarousel cards={cards} />
  );
};

export { AmenityCards };


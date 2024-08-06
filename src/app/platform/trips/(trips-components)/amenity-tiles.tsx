
import React from 'react';
import Tile from "@/components/ui/tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrossIcon } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface AmenityCardsProps {
  amenities: string[];
}

const AmenityTiles: React.FC<AmenityCardsProps> = ({ amenities }) => {
  const tilesPerCard = 3;
  const cards = [];

  for (let i = 0; i < amenities.length; i += tilesPerCard) {
    const cardTiles = amenities.slice(i, i + tilesPerCard);
    const card = (
      <CarouselItem key={`amenity-card-${i}`}>
        <div className="grid grid-cols-3 gap-4 justify-center mx-auto">
          {cardTiles.map((label, idx) => (
            <Tile key={`amenity-tile-${i}-${idx}`} label={label} icon={<CrossIcon />} />
          ))}
        </div>
      </CarouselItem>
    );
    cards.push(card);
  }

  return (
    <Carousel opts={{ loop: true }}>
      <CarouselContent>
        {cards}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export { AmenityTiles };

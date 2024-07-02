
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CardCarouselProps {
  cards: React.ReactElement[];
}

const CardCarousel: React.FC<CardCarouselProps> = ({ cards }) => {
  return (
    <Carousel opts={{loop: true}}>
      <CarouselContent>
        {cards.map((card, index) => (
          <CarouselItem className='basis-1/3"' key={index}>
            {card}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export { CardCarousel };

// Make sure to adjust the import path for the Carousel components based on your project structure.

'use client';

import React from 'react';
import { useSearchContext } from '@/contexts/search-context-proivder';
import SearchCardSmall from './search-card-small';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const SearchCarousel: React.FC = () => {
  const { activeSearches } = useSearchContext();

  return (
    <Carousel className="w-full max-w-5xl" opts={{ slidesToScroll: 2 }}>
      <CarouselContent className="-ml-2 md:-ml-4">
        {activeSearches.map((search) => (
          <CarouselItem key={search.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
            <SearchCardSmall
              trip={search}
              stateCode={(search.locationString && search.locationString.slice(-2)) || 'ut'}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default SearchCarousel;
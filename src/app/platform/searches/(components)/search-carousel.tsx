'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchContext } from '@/contexts/search-context-provider';
import SearchCardSmall from './search-card-small';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TripAndMatches } from "@/types/";

const SearchCarousel: React.FC = () => {
  const { state, actions } = useSearchContext();
  const [isOpen, setIsOpen] = useState<string>("item-1");
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (api && isOpen === "item-1") {
      api.scrollTo(currentIndex);
    }
  }, [api, isOpen, currentIndex]);

  const handleClick = (search: TripAndMatches) => {
    if (state.currentSearch?.id !== search.id) {
      actions.setCurrentSearch(search);
      actions.fetchListings(search.latitude, search.longitude, 100);
    }
    setIsOpen("");
  };

  return (
    <Accordion type="single" className='w-full' collapsible value={isOpen} onValueChange={setIsOpen}>
      <AccordionItem className='' value="item-1">
        <AccordionTrigger className=' w-full  text-2xl font-bold mb-2 justify-center gap-x-4'>Active Searches</AccordionTrigger>
        <AccordionContent className='flex items-center justify-center'>
          <Carousel className="w-full max-w-5xl" opts={{ slidesToScroll: 2 }} setApi={setApi}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {state.activeSearches.map((search) => (
                <CarouselItem onClick={() => handleClick(search)} key={search.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SearchCarousel;
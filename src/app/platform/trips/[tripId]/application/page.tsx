'use client';

import { useParams } from 'next/navigation';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { getTripLocationString } from '@/utils/trip-helpers';
import { useTripContext } from '@/contexts/trip-context-provider';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { PAGE_MARGIN } from '@/constants/styles';
import { useState, useCallback, useEffect } from 'react';

const navigationItems = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'residential', label: 'Residential History' },
  { id: 'income', label: 'Income' },
  { id: 'questionnaire', label: 'Questionnaire' },
];

export default function ApplicationPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip } } = useTripContext();

  const [api, setApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentStep(api.selectedScrollSnap());
  }, [api]);

  const scrollToIndex = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  // Fix: Change useState to useEffect for event listener setup
  useEffect(() => {
    if (!api) return;

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  return (
    <div className={PAGE_MARGIN}>
      <Breadcrumbs
        links={[
          { label: 'Trips', url: '/platform/trips' },
          { label: getTripLocationString(trip), url: `/platform/trips/${tripId}` },
          { label: 'Application' }
        ]}
        className="mb-4"
      />
      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {navigationItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-lg transition-colors duration-200",
                  currentStep === index
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "hover:bg-gray-50 text-gray-600"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Carousel Section */}
        <div className="flex-1 px-12">
          <Carousel
            className="w-full"
            setApi={setApi}
            opts={{
              align: 'start',
              skipSnaps: false,
            }}
          >
            <CarouselContent>
              <CarouselItem>
                <div className="px-6 pb-6min-h-[400px]">
                  <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                  <p className="text-gray-600">Form placeholder for basic information</p>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="p-6 min-h-[400px]">
                  <h2 className="text-xl font-semibold mb-4">Residential History</h2>
                  <p className="text-gray-600">Form placeholder for residential history</p>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="p-6 min-h-[400px]">
                  <h2 className="text-xl font-semibold mb-4">Income</h2>
                  <p className="text-gray-600">Form placeholder for income information</p>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="p-6 min-h-[400px]">
                  <h2 className="text-xl font-semibold mb-4">Questionnaire</h2>
                  <p className="text-gray-600">Form placeholder for questionnaire</p>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
}

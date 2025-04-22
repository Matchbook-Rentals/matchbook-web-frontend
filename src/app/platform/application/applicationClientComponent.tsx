'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { PAGE_MARGIN, ApplicationItemHeaderStyles } from '@/constants/styles';
import { PersonalInfo } from '../trips/(trips-components)/application-personal-info';
import { Identification } from '../trips/(trips-components)/application-identity';
import { Income } from '../trips/(trips-components)/application-income';
import Questionnaire from '../trips/(trips-components)/application-questionnaire';
import MobileApplicationEdit from '../trips/(trips-components)/mobile-application-edit';
import { upsertApplication, markComplete } from '@/app/actions/applications';
import { useWindowSize } from '@/hooks/useWindowSize'
import {
  validatePersonalInfo,
  validateIdentification,
  validateResidentialHistory,
  validateIncome,
  validateQuestionnaire
} from '@/utils/application-validation';
import { useApplicationStore } from '@/stores/application-store';
import { ResidentialLandlordInfo } from '../trips/(trips-components)/residential-landlord-info';
import { ScrollArea } from '@/components/ui/scroll-area';

const navigationItems = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'identification', label: 'Identification' },
  { id: 'residential', label: 'Residential History' },
  { id: 'income', label: 'Income' },
  { id: 'questionnaire', label: 'Questionnaire' },
];

export default function ApplicationClientComponent({ application }: { application: any }) {
  const router = useRouter();
  const { toast } = useToast();

  // Replace all individual state with store
  const {
    personalInfo,
    ids,
    residentialHistory,
    incomes,
    answers,
    initializeFromApplication,
    isEdited,
    setErrors,
    markSynced,
    checkCompletion
  } = useApplicationStore();

  // Initialize store with application data received from the server component
  useEffect(() => {
    setIsDataLoading(true);
    try {
      if (application) {
        console.log('Received user application from server:', application);
        initializeFromApplication(application);
      } else {
        console.warn('No application found for user');
        toast({
          title: "No Application Found",
          description: "You don't have an application yet. Please create one.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initializing application:', error);
      toast({
        title: "Error",
        description: "Failed to load application data",
        variant: "destructive",
      });
    } finally {
      setIsDataLoading(false);
    }
  }, [application, initializeFromApplication, toast]);

  // Carousel state
  const [api, setApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  const windowSize = useWindowSize();

  useEffect(() => {
    setIsMobile((windowSize?.width || 10000) < 640);
  }, [windowSize?.width]);

  const onSelect = useCallback(() => {
    if (!api) return;
    const newStep = api.selectedScrollSnap();
    setCurrentStep(newStep);
  }, [api]);

  // Update validateStep function
  const validateStep = (step: number) => {
    switch (step) {
      case 0: {
        // Now only validate personal info (name, DOB, SSN)
        const personalInfoError = validatePersonalInfo(personalInfo);
        setErrors('basicInfo', {
          personalInfo: personalInfoError,
          identification: {}, // Clear any previous identification errors
        });
        return Object.keys(personalInfoError).length === 0;
      }
      case 1: {
        // Identification is now its own step
        const identificationError = validateIdentification(ids);
        setErrors('identification', identificationError);
        return Object.keys(identificationError).length === 0;
      }
      case 2: {
        const residentialHistoryErrors = validateResidentialHistory(residentialHistory);
        setErrors('residentialHistory', residentialHistoryErrors as any);
        console.log('residentialHistoryErrors', residentialHistoryErrors);
        return Object.keys(residentialHistoryErrors).length === 0;
      }
      case 3: {
        const incomeErrors = validateIncome(incomes);
        setErrors('income', incomeErrors);
        return Object.keys(incomeErrors).length === 0;
      }
      case 4: {
        // Ensure 'answers' has all required properties, even if null.
        // The actual fix needs to be in your application-store.ts,
        // making sure the initial state of 'answers' includes:
        // { felony: null, felonyExplanation: '', evicted: null, evictedExplanation: '' }
        const questionnaireErrors = validateQuestionnaire(answers);
        setErrors('questionnaire', questionnaireErrors);
        return Object.keys(questionnaireErrors).length === 0;
      }
      default:
        return true;
    }
  };

  const scrollToIndex = async (index: number) => {
    let isValid = validateStep(currentStep);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please correct errors before navigating.",
        variant: "destructive",
      });
      return;
    }

    // Only execute this try catch if we have changes
    if (isEdited()) {
      setIsLoading(true);
      // Format the date if it exists
      const formattedDateOfBirth = personalInfo.dateOfBirth ?
        new Date(personalInfo.dateOfBirth).toISOString() :
        undefined;

      const applicationData = {
        ...personalInfo,
        // Override with the formatted date
        dateOfBirth: formattedDateOfBirth,
        ...answers,
        incomes,
        identifications: ids.map(id => ({
          id: id.id,
          idType: id.idType,
          idNumber: id.idNumber,
          isPrimary: id.isPrimary,
          idPhotos: id.idPhotos?.length ? id.idPhotos.map(photo => ({
            id: photo.id,
            url: photo.url,
            isPrimary: photo.isPrimary
          })) : []
        })),
        residentialHistories: residentialHistory,
      };
      try {
        const result = await upsertApplication(applicationData);
        setIsLoading(false);
        if (result.success) {
          markSynced();
          if (result.application?.id) {
            checkCompletion(result.application?.id);
          }
          api?.scrollTo(index);
        } else {
          toast({
            title: "Error",
            description: "Failed to save changes",
            variant: "destructive",
          });
        }
      } catch (error) {
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to save changes",
          variant: "destructive",
        });
      }
    } else {
      // If no changes, just scroll to the index
      api?.scrollTo(index);
    }
  };

  const scrollToIndexSkipValidation = (index: number) => {
    api?.scrollTo(index);
  };

  useEffect(() => {
    if (!api) return;
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  const handleSubmit = async () => {
    // Format the date if it exists
    const formattedDateOfBirth = personalInfo.dateOfBirth ?
      new Date(personalInfo.dateOfBirth).toISOString() :
      undefined;

    const applicationData = {
      ...personalInfo,
      // Override with the formatted date
      dateOfBirth: formattedDateOfBirth,
      ...answers,
      incomes,
      identifications: ids.map(id => ({
        id: id.id,
        idType: id.idType,
        idNumber: id.idNumber,
        isPrimary: id.isPrimary,
        idPhotos: id.idPhotos?.length ? id.idPhotos.map(photo => ({
          id: photo.id,
          url: photo.url,
          isPrimary: photo.isPrimary
        })) : []
      })),
      residentialHistories: residentialHistory,
    };
    let isValid = validateStep(currentStep);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please correct errors before navigating.",
        variant: "destructive",
      });
      return;
    }
    console.log('applicationData', applicationData);

    setIsLoading(true);
    try {
      const result = await upsertApplication(applicationData);
      setIsLoading(false);
      if (result.success) {
        markSynced();
        toast({
          title: "Success",
          description: "Application submitted successfully",
        });
        if (result.application?.id) {
          let completeResult = await markComplete(result.application?.id);
          console.log('completeResult', completeResult);

          // Redirect to dashboard or other appropriate page after successful submission
          router.push('/platform/dashboard');
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to submit application",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    }
  };

  // Import the loading skeletons
  const MobileApplicationSkeleton = React.lazy(() => import('../trips/(trips-components)/mobile-application-skeleton'));

  // Show loading UI while data is loading
  if (isDataLoading) {
    return (
      <div className={PAGE_MARGIN}>
        <div className="flex gap-2 mb-4 items-center">
          <div className="animate-pulse bg-muted h-6 w-24 rounded-md" />
          <div className="animate-pulse bg-muted h-5 w-3 rounded-full" />
          <div className="animate-pulse bg-muted h-6 w-28 rounded-md" />
        </div>

        {isMobile ? (
          <MobileApplicationSkeleton />
        ) : (
          <div className="flex gap-6 max-w-full overflow-x-hidden">
            {/* Sidebar Navigation Skeleton */}
            <div className="hidden lg:block pt-1 w-64 shrink-0">
              <nav className="space-y-1">
                {navigationItems.map((item, index) => (
                  <div key={item.id} className="animate-pulse bg-muted h-10 w-full rounded-lg mb-2" />
                ))}
              </nav>
            </div>

            {/* Main Content Skeleton */}
            <div className="relative flex-1 min-w-0">
              <div className="p-6 overflow-y-auto min-h-[400px] border rounded-lg">
                <div className="animate-pulse bg-muted h-8 w-48 mb-6 rounded-md" />

                {/* Form fields skeletons */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="animate-pulse bg-muted h-5 w-28 rounded-md" />
                      <div className="animate-pulse bg-muted h-10 w-full rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <div className="animate-pulse bg-muted h-5 w-28 rounded-md" />
                      <div className="animate-pulse bg-muted h-10 w-full rounded-md" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="animate-pulse bg-muted h-5 w-36 rounded-md" />
                    <div className="animate-pulse bg-muted h-10 w-full rounded-md" />
                  </div>

                  <div className="space-y-2">
                    <div className="animate-pulse bg-muted h-5 w-28 rounded-md" />
                    <div className="animate-pulse bg-muted h-10 w-full rounded-md" />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons Skeletons */}
              <div className="flex justify-between px-6 mt-4 mb-4">
                <div className="animate-pulse bg-muted h-10 w-20 rounded-md" />
                <div className="animate-pulse bg-muted h-10 w-20 rounded-md" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={PAGE_MARGIN}>

      {isMobile ? (
        <MobileApplicationEdit />
      ) : (
        <div className="flex gap-6 max-w-full overflow-x-hidden">
          {/* Sidebar Navigation - Hidden on mobile */}
          <div className="hidden lg:block pt-1 w-64 shrink-0">
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

          {/* Carousel Section with Overlay */}
          <div className="relative flex-1 min-w-0">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-300 bg-opacity-50 flex items-center justify-center z-10">
                <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              </div>
            )}
            <Carousel
              className="w-full"
              setApi={setApi}
              opts={{
                align: 'start',
                skipSnaps: false,
                watchDrag: false,
              }}
            >
              <CarouselContent className="w-full">
                <CarouselItem>
                  <div className="px-6 pb-6 pt-0 overflow-y-auto min-h-[400px]">
                    <h2 className={ApplicationItemHeaderStyles}>
                      Basic Information
                    </h2>
                    <PersonalInfo />
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="px-6 pb-6 pt-0 overflow-y-auto min-h-[400px]">
                    <h2 className={ApplicationItemHeaderStyles}>
                      Identification
                    </h2>
                    <Identification />
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="px-6 pb-6 overflow-y-auto min-h-[400px]">
                    <h2 className={cn(ApplicationItemHeaderStyles, "mb-1")}>
                      Residential History
                    </h2>
                    <ScrollArea className='h-[500px]' >
                      <p className="text-sm text-gray-500 mb-4">
                        Please add 24 months of residential history or three previous addresses.
                      </p>
                      <ResidentialLandlordInfo />
                    </ScrollArea>
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="px-6 pb-6 overflow-y-auto min-h-[400px]">
                    <h2 className={ApplicationItemHeaderStyles}>
                      Income
                    </h2>
                    <Income />
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="px-6 pb-6 overflow-y-auto min-h-[400px]">
                    <h2 className={ApplicationItemHeaderStyles}>
                      Questionnaire
                    </h2>
                    <Questionnaire />
                    <Button
                      onClick={handleSubmit}
                      className="w-full mt-4"
                      disabled={!isEdited()}
                    >
                      {isEdited() ? 'Save Changes' : 'No Changes'}
                    </Button>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>

            {/* Navigation Buttons moved to bottom */}
            <div className="flex justify-between px-6 mt-1 mb-4">
              <Button
                onClick={() => {
                  if (!validateStep(currentStep)) {
                    toast({
                      title: "Validation Error",
                      description: "Please correct errors before navigating.",
                      variant: "destructive"
                    });
                    return;
                  }
                  api?.scrollPrev();
                }}
                disabled={currentStep === 0}
              >
               Back
              </Button>
              <Button
                onClick={() => {
                  if (!validateStep(currentStep)) {
                    toast({
                      title: "Validation Error",
                      description: "Please correct errors before navigating.",
                      variant: "destructive"
                    });
                    return;
                  }
                  scrollToIndex(currentStep + 1);
                }}
                disabled={currentStep === navigationItems.length - 1}
              >
                Next
              </Button>
            </div>

            {/* Skip Validation Navigation Buttons */}
            <div className="flex justify-between px-6 mb-4">
              <Button
                onClick={() => api?.scrollPrev()}
                disabled={currentStep === 0}
                variant="outline"
                className="text-gray-500 border-gray-300"
              >
                Skip Back
              </Button>
              <Button
                onClick={() => scrollToIndexSkipValidation(currentStep + 1)}
                disabled={currentStep === navigationItems.length - 1}
                variant="outline"
                className="text-gray-500 border-gray-300"
              >
                Skip Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { getTripLocationString } from '@/utils/trip-helpers';
import { useTripContext } from '@/contexts/trip-context-provider';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { PAGE_MARGIN, APP_PAGE_MARGIN, ApplicationItemHeaderStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';
import { PersonalInfo } from '../../(trips-components)/application-personal-info';
import { Identification } from '../../(trips-components)/application-identity';
import { ResidentialHistory } from '../../(trips-components)/application-resident-history';
import { LandlordInfo } from '../../(trips-components)/application-landlord-info';
import { Income } from '../../(trips-components)/application-income';
import Questionnaire from '../../(trips-components)/application-questionnaire';
import MobileApplicationEdit from '../../(trips-components)/mobile-application-edit';
import { upsertApplication, markComplete } from '@/app/actions/applications';
import { useWindowSize } from '@/hooks/useWindowSize'
import {
  validatePersonalInfo,
  validateIdentification,
  validateResidentialHistory,
  validateLandlordInfo,
  validateIncome,
  validateQuestionnaire
} from '@/utils/application-validation';
import { useApplicationStore } from '@/stores/application-store';
import { ResidentialLandlordInfo } from '../../(trips-components)/residential-landlord-info';

const navigationItems = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'residential', label: 'Residential History' },
  { id: 'income', label: 'Income' },
  { id: 'questionnaire', label: 'Questionnaire' },
];

const itemHeaderStyles = "text-[30px] font-medium mb-4";

// Update the helper function to be more specific about field changes
const getChangedFields = (current: any, initial: any) => {
  const changes: string[] = [];

  // Helper function to normalize objects for comparison
  const normalizeObject = (obj: any) => {
    const normalized = { ...obj };
    Object.keys(normalized).forEach(key => {
      if (normalized[key] === undefined || normalized[key] === null) {
        normalized[key] = '';
      }
    });
    return normalized;
  };

  // Check personal info fields
  const personalFields = ['firstName', 'lastName'];
  const changedPersonalFields = personalFields.filter(field =>
    normalizeObject(current.personalInfo)[field] !== normalizeObject(initial.personalInfo)[field]
  );
  if (changedPersonalFields.length > 0) {
    changes.push(`Personal Information (${changedPersonalFields.map(field =>
      field === 'firstName' ? 'First Name' : 'Last Name'
    ).join(', ')})`);
  }

  // Check residential history fields
  const residentialFields = ['currentStreet', 'currentApt', 'currentCity', 'currentState', 'currentZipCode', 'housingStatus', 'monthlyPayment', 'durationOfTenancy'];
  const changedResidentialFields = residentialFields.filter(field =>
    normalizeObject(current.residentialHistory)[field] !== normalizeObject(initial.residentialHistory)[field]
  );
  if (changedResidentialFields.length > 0) {
    changes.push(`Residential History (${changedResidentialFields.map(field => {
      const fieldMap: { [key: string]: string } = {
        currentStreet: 'Street Address',
        currentApt: 'Apartment',
        currentCity: 'City',
        currentState: 'State',
        currentZipCode: 'ZIP Code',
        housingStatus: 'Housing Status',
        monthlyPayment: 'Monthly Payment',
        durationOfTenancy: 'Duration of Stay'
      };
      return fieldMap[field] || field;
    }).join(', ')})`);
  }

  // Check landlord info fields
  if (current.residentialHistory.housingStatus === 'rent') {
    const landlordFields = ['landlordFirstName', 'landlordLastName', 'landlordEmail', 'landlordPhoneNumber'];
    const changedLandlordFields = landlordFields.filter(field =>
      normalizeObject(current.landlordInfo)[field] !== normalizeObject(initial.landlordInfo)[field]
    );
    if (changedLandlordFields.length > 0) {
      changes.push(`Landlord Information (${changedLandlordFields.map(field => {
        const fieldMap: { [key: string]: string } = {
          landlordFirstName: 'First Name',
          landlordLastName: 'Last Name',
          landlordEmail: 'Email',
          landlordPhoneNumber: 'Phone Number'
        };
        return fieldMap[field] || field;
      }).join(', ')})`);
    }
  }

  // Check income fields
  const currentIncomes = current.incomes || [];
  const initialIncomes = initial.incomes || [];

  const hasIncomeChanges = () => {
    if (currentIncomes.length !== initialIncomes.length) {
      return [`Number of Income Sources (${initialIncomes.length} → ${currentIncomes.length})`];
    }

    const changes = [];
    for (let i = 0; i < currentIncomes.length; i++) {
      if (currentIncomes[i].source !== initialIncomes[i].source) {
        changes.push(`Income Source ${i + 1} (${initialIncomes[i].source || 'empty'} → ${currentIncomes[i].source})`);
      }
      const initialAmount = (initialIncomes[i].monthlyAmount || '').toString().replace(/[$,]/g, '').split('.')[0];
      const currentAmount = (currentIncomes[i].monthlyAmount || '').toString().replace(/[$,]/g, '').split('.')[0];
      if (currentAmount !== initialAmount) {
        changes.push(`Monthly Amount ${i + 1} ($${initialAmount || '0'} → $${currentAmount})`);
      }
    }
    // Use Array.from instead of spread operator for better compatibility
    return Array.from(new Set(changes)); // Remove duplicates and fix TS error
  };

  const incomeChanges = hasIncomeChanges();
  if (incomeChanges.length > 0) {
    changes.push(`Income (${incomeChanges.join(', ')})`);
  }

  // Check questionnaire answers
  const questionnaireFields = ['evicted', 'felony', 'felonyExplanation', 'evictedExplanation'];
  const changedQuestionnaireFields = questionnaireFields.filter(field =>
    normalizeObject(current.answers)[field] !== normalizeObject(initial.answers)[field]
  );
  if (changedQuestionnaireFields.length > 0) {
    changes.push(`Questionnaire (${changedQuestionnaireFields.map(field => {
      const fieldMap: { [key: string]: string } = {
        evicted: 'Eviction History',
        felony: 'Lease Break History',
        felonyExplanation: 'Felony Explanation',
        evictedExplanation: 'Evicted Explanation'
      };
      return fieldMap[field] || field;
    }).join(', ')})`);
  }

  return changes;
};

export default function ApplicationPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();
  const { state: { trip, application, hasApplication }, actions: { setHasApplication } } = useTripContext();
  const { toast } = useToast();

  // Replace all individual state with store
  const {
    personalInfo,
    ids,
    residentialHistory,
    landlordInfo,
    incomes,
    answers,
    initializeFromApplication,
    isEdited,
    setErrors,
    markSynced,
    checkCompletion
  } = useApplicationStore();

  // Initialize store with application data
  useEffect(() => {
    initializeFromApplication(application);
  }, [application, initializeFromApplication]);

  // Carousel state
  const [api, setApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
      try {
        const result = await upsertApplication({
          ...personalInfo,
          ...residentialHistory,
          ...answers,
          incomes,
          identifications: [{ idType: ids[0].idType, idNumber: ids[0].idNumber }],
        });
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

  useEffect(() => {
    if (!api) return;
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  const handleSubmit = async () => {
    const applicationData = {
      ...personalInfo,
      ...residentialHistory,
      ...answers,
      incomes,
      identifications: [{ idType: ids[0].idType, idNumber: ids[0].idNumber }],
    };

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
        setHasApplication(true);
        if (result.application?.id) {
          let completeResult = await markComplete(result.application?.id);
          console.log('completeResult', completeResult);
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

  // Update validateStep function
  const validateStep = (step: number) => {
    switch (step) {
      case 0: {
        const personalInfoError = validatePersonalInfo(personalInfo);
        const identificationError = validateIdentification(ids);
        setErrors('basicInfo', {
          personalInfo: personalInfoError,
          identification: identificationError,
        });
        return Object.keys(personalInfoError).length === 0 &&
               Object.keys(identificationError).length === 0;
      }
      case 1: {
        const residentialHistoryErrors = validateResidentialHistory(residentialHistory);
        const landlordInfoErrors = residentialHistory.housingStatus === 'rent'
          ? validateLandlordInfo(landlordInfo)
          : {};

        setErrors('residentialHistory', residentialHistoryErrors);
        setErrors('landlordInfo', landlordInfoErrors);

        return Object.keys(residentialHistoryErrors).length === 0 &&
               (residentialHistory.housingStatus !== 'rent' || Object.keys(landlordInfoErrors).length === 0);
      }
      case 2: {
        const incomeErrors = validateIncome(incomes);
        setErrors('income', incomeErrors);
        return Object.keys(incomeErrors).length === 0;
      }
      case 3: {
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

  return (
    <div className={PAGE_MARGIN}>
      <Breadcrumbs className="mb-4"
        links={[
          { label: getTripLocationString(trip), url: `/platform/trips/${tripId}` },
          { label: 'Application' }
        ]} />


      {isMobile ? (
        <MobileApplicationEdit />
      ) : (
        <div className="flex gap-6 max-w-full overflow-x-hidden">
          {/* Sidebar Navigation - Hidden on mobile */}
          <div onClick={() => console.log(application)} className="hidden lg:block pt-1 w-64 shrink-0">
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
                  <div className="px-6 pb-6 pt-0 overflow-y-auto  min-h-[400px]">
                    <h2 className={ApplicationItemHeaderStyles}>
                      Basic Information
                    </h2>
                    <PersonalInfo />
                    <div className="mt-8">
                      <Identification />
                    </div>
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="px-6 pb-6 overflow-y-auto min-h-[400px]">
                    <h2 className={ApplicationItemHeaderStyles}>
                      Residential History
                    </h2>
                    <ResidentialLandlordInfo />
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="px-6 pb-6 overflow-y-auto min-h-[400px]">
                    <h2 className={itemHeaderStyles}>
                      Income
                    </h2>
                    <Income />
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="px-6 pb-6 overflow-y-auto min-h-[400px]">
                    <h2 className={itemHeaderStyles}>
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
          </div>
        </div>
      )}
    </div>
  );
}

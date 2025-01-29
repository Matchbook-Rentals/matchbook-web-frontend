'use client';

import { useParams } from 'next/navigation';
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
import { createApplication } from '@/app/actions/applications';
import { useWindowSize } from '@/hooks/useWindowSize'

const navigationItems = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'residential', label: 'Residential History' },
  { id: 'income', label: 'Income' },
  { id: 'questionnaire', label: 'Questionnaire' },
];

const itemHeaderStyles = "text-[30px] font-meidum  mb-4 ";

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
    return [...new Set(changes)]; // Remove duplicates
  };

  const incomeChanges = hasIncomeChanges();
  if (incomeChanges.length > 0) {
    changes.push(`Income (${incomeChanges.join(', ')})`);
  }

  // Check questionnaire answers
  const questionnaireFields = ['evicted', 'brokenLease', 'landlordDispute', 'explanation'];
  const changedQuestionnaireFields = questionnaireFields.filter(field =>
    normalizeObject(current.answers)[field] !== normalizeObject(initial.answers)[field]
  );
  if (changedQuestionnaireFields.length > 0) {
    changes.push(`Questionnaire (${changedQuestionnaireFields.map(field => {
      const fieldMap: { [key: string]: string } = {
        evicted: 'Eviction History',
        brokenLease: 'Lease Break History',
        landlordDispute: 'Landlord Disputes',
        explanation: 'Explanation'
      };
      return fieldMap[field] || field;
    }).join(', ')})`);
  }

  return changes;
};

export default function ApplicationPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip, application, hasApplication }, actions: { setHasApplication } } = useTripContext();
  const { toast } = useToast();

  // Store initial application state
  const [initialState] = useState({
    personalInfo: {
      firstName: application?.firstName || '',
      lastName: application?.lastName || ''
    },
    ids: application?.identifications || [{ idType: '', idNumber: '' }],
    verificationImages: application?.verificationImages || [],
    residentialHistory: {
      currentStreet: application?.currentStreet || '',
      currentApt: application?.currentApt || '',
      currentCity: application?.currentCity || '',
      currentState: application?.currentState || '',
      currentZipCode: application?.currentZipCode || '',
      housingStatus: application?.housingStatus || 'rent',
      monthlyPayment: application?.monthlyPayment || '',
      durationOfTenancy: application?.durationOfTenancy || '',
    },
    landlordInfo: {
      landlordFirstName: application?.landlordFirstName || '',
      landlordLastName: application?.landlordLastName || '',
      landlordEmail: application?.landlordEmail || '',
      landlordPhoneNumber: application?.landlordPhoneNumber || '',
    },
    incomes: application?.incomes?.map(income => ({
      source: income.source || '',
      monthlyAmount: (income.monthlyAmount || '').toString().replace(/[$,]/g, '').split('.')[0]
    })) || [{ source: '', monthlyAmount: '' }],
    answers: {
      evicted: application?.evicted || false,
      brokenLease: application?.brokenLease || false,
      landlordDispute: application?.landlordDispute || false,
      explanation: application?.explanation || ''
    }
  });

  // Form state
  const [personalInfo, setPersonalInfo] = useState(initialState.personalInfo);
  const [ids, setIds] = useState(initialState.ids);
  const [verificationImages, setVerificationImages] = useState(initialState.verificationImages);
  const [residentialHistory, setResidentialHistory] = useState(initialState.residentialHistory);
  const [landlordInfo, setLandlordInfo] = useState(initialState.landlordInfo);
  const [incomes, setIncomes] = useState(initialState.incomes);
  const [answers, setAnswers] = useState(initialState.answers);

  // Add isEditing computation
  const isEditing = useCallback(() => {
    return JSON.stringify({
      personalInfo,
      ids,
      verificationImages,
      residentialHistory,
      landlordInfo,
      incomes,
      answers
    }) !== JSON.stringify(initialState);
  }, [
    personalInfo,
    ids,
    verificationImages,
    residentialHistory,
    landlordInfo,
    incomes,
    answers,
    initialState
  ]);

  // Carousel state
  const [api, setApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);

  const [isMobile, setIsMobile] = useState(false);
  const windowSize = useWindowSize();

  useEffect(() => {
    setIsMobile((windowSize?.width || 10000) < 640);
  }, [windowSize?.width]);

  const onSelect = useCallback(() => {
    if (!api) return;
    const newStep = api.selectedScrollSnap();

    // Check for unsaved changes before updating step
    if (isEditing()) {
      const currentState = {
        personalInfo,
        ids,
        verificationImages,
        residentialHistory,
        landlordInfo,
        incomes,
        answers
      };

      const changedFields = getChangedFields(currentState, initialState);

      if (changedFields.length > 0) {
        toast({
          title: "Unsaved Changes",
          description: (
            <div className="flex flex-col gap-2 bg-white">
              <div>You have unsaved changes in: {changedFields.join(', ')}</div>
              <Button
                variant="outline"
                onClick={() => {
                  setPersonalInfo(initialState.personalInfo);
                  setIds(initialState.ids);
                  setVerificationImages(initialState.verificationImages);
                  setResidentialHistory(initialState.residentialHistory);
                  setLandlordInfo(initialState.landlordInfo);
                  setIncomes(initialState.incomes);
                  setAnswers(initialState.answers);
                  api.scrollTo(newStep);
                  setCurrentStep(newStep);
                }}
                className="bg-[#404040] text-white hover:bg-[#505050]"
              >
                Revert Changes
              </Button>
            </div>
          ),
          className: "bg-white",
        });
        // Prevent step change by scrolling back to current step
        api.scrollTo(currentStep);
        return;
      }
    }

    setCurrentStep(newStep);
  }, [api, isEditing, initialState, personalInfo, ids, verificationImages, residentialHistory, landlordInfo, incomes, answers, toast, currentStep]);

  const scrollToIndex = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

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
      identifications: [{ idType: ids.idType, idNumber: ids.idNumber }],
      verificationImages,
      ...(residentialHistory.housingStatus === 'rent' ? landlordInfo : {})
    };

    try {
      const result = await createApplication(applicationData);
      if (result.success) {
        toast({
          title: "Success",
          description: "Application submitted successfully",
        });
        setHasApplication(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    }
  };

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
      <div className="flex gap-6 max-w-full  overflow-x-hidden ">
        {/* Sidebar Navigation - Hidden on mobile */}
        <div onClick={() => console.log(application)} className="hidden md:block pt-1 w-64 shrink-0">
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
        <div className="flex-1 min-w-0 ">
          <Carousel
            className="w-full"
            setApi={setApi}
            opts={{
              align: 'start',
              skipSnaps: false,
              watchDrag: isMobile
            }}
          >
            <CarouselContent className="w-full">
              <CarouselItem>
                <div className="px-6 pb-6 pt-0  min-h-[400px]">
                  <h2 className={ApplicationItemHeaderStyles}>Basic Information</h2>
                  <PersonalInfo
                    personalInfo={personalInfo}
                    setPersonalInfo={setPersonalInfo}
                  />
                  <div className="mt-8">
                    <h3 className={ApplicationItemSubHeaderStyles}>Identification</h3>
                    <Identification
                      ids={ids}
                      setIds={setIds}
                      verificationImages={verificationImages.filter(img => img.category === 'Identification')}
                      setVerificationImages={setVerificationImages}
                    />
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem>
                <div className="px-6 pb-6 min-h-[400px]">
                  <h2 className={ApplicationItemHeaderStyles}>Residential History</h2>
                  <ResidentialHistory
                    residentialHistory={residentialHistory}
                    setResidentialHistory={setResidentialHistory}
                  />
                  {residentialHistory.housingStatus === 'rent' && (
                    <LandlordInfo
                      landlordInfo={landlordInfo}
                      setLandlordInfo={setLandlordInfo}
                      isRenter={true}
                    />
                  )}
                </div>
              </CarouselItem>

              <CarouselItem>
                <div className="px-6 pb-6 min-h-[400px]">
                  <h2 className={itemHeaderStyles}>Income</h2>
                  <Income
                    incomes={incomes}
                    setIncomes={setIncomes}
                    verificationImages={verificationImages.filter(img => img.category === 'Income')}
                    setVerificationImages={setVerificationImages}
                  />
                </div>
              </CarouselItem>

              <CarouselItem>
                <div className="px-6 pb-6 min-h-[400px]">
                  <h2 className={itemHeaderStyles}>Questionnaire</h2>
                  <Questionnaire
                    answers={answers}
                    setAnswers={setAnswers}
                  />
                  <Button
                    onClick={handleSubmit}
                    className="w-full mt-4"
                    disabled={!isEditing()}
                  >
                    {isEditing() ? 'Save Changes' : 'No Changes'}
                  </Button>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>

          {/* Navigation Buttons */}
          <div className="flex justify-between ">
            <Button
              variant="outline"
              onClick={() => {
                if (isEditing()) {
                  toast({
                    title: "Unsaved Changes",
                    description: (
                      <div className="flex flex-col gap-2 bg-white">
                        <div>Please save your changes before navigating</div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPersonalInfo(initialState.personalInfo);
                            setIds(initialState.ids);
                            setVerificationImages(initialState.verificationImages);
                            setResidentialHistory(initialState.residentialHistory);
                            setLandlordInfo(initialState.landlordInfo);
                            setIncomes(initialState.incomes);
                            setAnswers(initialState.answers);
                            api?.scrollPrev();
                          }}
                          className="bg-[#404040] text-white hover:bg-[#505050]"
                        >
                          Revert Changes
                        </Button>
                      </div>
                    ),
                    className: "bg-white",
                  });
                  return;
                }
                api?.scrollPrev();
              }}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (isEditing()) {
                  toast({
                    title: "Unsaved Changes",
                    description: (
                      <div className="flex flex-col gap-2 bg-white">
                        <div>Please save your changes before navigating</div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPersonalInfo(initialState.personalInfo);
                            setIds(initialState.ids);
                            setVerificationImages(initialState.verificationImages);
                            setResidentialHistory(initialState.residentialHistory);
                            setLandlordInfo(initialState.landlordInfo);
                            setIncomes(initialState.incomes);
                            setAnswers(initialState.answers);
                            api?.scrollNext();
                          }}
                          className="bg-[#404040] text-white hover:bg-[#505050]"
                        >
                          Revert Changes
                        </Button>
                      </div>
                    ),
                    className: "bg-white",
                  });
                  return;
                }
                api?.scrollNext();
              }}
              disabled={currentStep === navigationItems.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default function ApplicationPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip, application, hasApplication }, actions: { setHasApplication } } = useTripContext();
  const { toast } = useToast();

  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    firstName: application?.firstName || '',
    lastName: application?.lastName || ''
  });
  const [ids, setIds] = useState(application?.identifications || [{ idType: '', idNumber: '' }]);
  const [verificationImages, setVerificationImages] = useState<Array<{ url: string, category: 'Identification' | 'Income' }>>( application?.verificationImages || []);
  const [residentialHistory, setResidentialHistory] = useState({
    currentStreet: application?.currentStreet || '',
    currentApt: application?.currentApt || '',
    currentCity: application?.currentCity || '',
    currentState: application?.currentState || '',
    currentZipCode: application?.currentZipCode || '',
    housingStatus: application?.housingStatus || 'rent',
    monthlyPayment: application?.monthlyPayment || '',
    durationOfTenancy: application?.durationOfTenancy || '',
  });
  const [landlordInfo, setLandlordInfo] = useState({
    landlordFirstName: application?.landlordFirstName || '',
    landlordLastName: application?.landlordLastName || '',
    landlordEmail: application?.landlordEmail || '',
    landlordPhoneNumber: application?.landlordPhoneNumber || '',
  });
  const [incomes, setIncomes] = useState(application?.incomes || [{ source: '', monthlyAmount: '' }]);
  const [answers, setAnswers] = useState({
    evicted: application?.evicted || false,
    brokenLease: application?.brokenLease || false,
    landlordDispute: application?.landlordDispute || false,
    explanation: application?.explanation || ''
  });

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
    setCurrentStep(api.selectedScrollSnap());
  }, [api]);

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
                  >
                    Submit Application
                  </Button>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>

          {/* Navigation Buttons */}
          <div className="flex justify-between ">
            <Button
              variant="outline"
              onClick={() => api?.scrollPrev()}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => api?.scrollNext()}
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

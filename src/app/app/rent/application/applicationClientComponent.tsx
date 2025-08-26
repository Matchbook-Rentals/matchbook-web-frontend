'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { PAGE_MARGIN, ApplicationItemHeaderStyles } from '@/constants/styles';
import { PersonalInfo } from '../searches/(trips-components)/application-personal-info';
import { logger } from '@/lib/logger';
import { Identification } from '../searches/(trips-components)/application-identity';
import { Income } from '../searches/(trips-components)/application-income';
import Questionnaire from '../searches/(trips-components)/application-questionnaire';
import MobileApplicationEdit from '../searches/(trips-components)/mobile-application-edit';
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
import { ResidentialLandlordInfo } from '../searches/(trips-components)/residential-landlord-info';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ApplicationClientComponent({ 
  application, 
  isMobile: initialIsMobile = false 
}: { 
  application: any | null;
  isMobile?: boolean;
}) {
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
    // If application exists, pre-fill the form
    if (application) {
      logger.debug('Received user application from server', application);
      initializeFromApplication(application);
    }
    // If no application, the form will show empty (default store state)
  }, [application, initializeFromApplication]);

  const [isLoading, setIsLoading] = useState(false);

  // Mobile detection - initialize with server-provided value
  const [isMobile, setIsMobile] = useState<boolean>(initialIsMobile);
  const windowSize = useWindowSize();

  useEffect(() => {
    // Update mobile state based on actual window size for responsive changes
    if (windowSize?.width !== undefined) {
      setIsMobile(windowSize.width < 640);
    }
  }, [windowSize?.width]);

  const validateForm = () => {
    const personalInfoError = validatePersonalInfo(personalInfo);
    const identificationError = validateIdentification(ids);
    const residentialHistoryErrors = validateResidentialHistory(residentialHistory);
    const incomeErrors = validateIncome(incomes);
    const questionnaireErrors = validateQuestionnaire(answers);

    setErrors('basicInfo', {
      personalInfo: personalInfoError,
      identification: identificationError,
    });
    setErrors('residentialHistory', residentialHistoryErrors as any);
    setErrors('income', incomeErrors);
    setErrors('questionnaire', questionnaireErrors);

    return (
      Object.keys(personalInfoError).length === 0 &&
      Object.keys(identificationError).length === 0 &&
      Object.keys(residentialHistoryErrors).length === 0 &&
      Object.keys(incomeErrors).length === 0 &&
      Object.keys(questionnaireErrors).length === 0
    );
  };

  const handleSubmit = async () => {
    const isValid = validateForm();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please correct errors before submitting.",
        variant: "destructive",
      });
      return;
    }

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

    logger.debug('Application data to submit', applicationData);

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
          logger.debug('Complete application result', completeResult);

          // Redirect to dashboard or other appropriate page after successful submission
          router.push('/app/dashboard');
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


  return (
    <div className="flex flex-col w-full max-w-[1140px] mx-auto items-start justify-center gap-4 p-4">
      {isMobile ? (
        <MobileApplicationEdit application={application} />
      ) : (
        <>
          {/* Page Title */}
          <h1 className="w-full text-center text-[#373940] font-['Poppins'] text-[28px] md:text-[24px] sm:text-[20px] font-medium leading-normal">
            Review Your Application
          </h1>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-gray-300 bg-opacity-50 flex items-center justify-center z-50">
              <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </div>
          )}

          {/* Personal Information Section */}
          <section className="flex flex-col items-center justify-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
            <header className="flex flex-col items-center justify-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
              <h1 className="relative self-stretch mt-[-1.00px] font-text-heading-medium-medium font-[number:var(--text-heading-medium-medium-font-weight)] text-[#373940] text-[length:var(--text-heading-medium-medium-font-size)] text-center tracking-[var(--text-heading-medium-medium-letter-spacing)] leading-[var(--text-heading-medium-medium-line-height)] [font-style:var(--text-heading-medium-medium-font-style)]">
                MatchBook Universal Application
              </h1>

            </header>

            <Card className="flex flex-col items-center justify-center gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] rounded-2xl overflow-hidden border border-solid border-[#cfd4dc]">
              <CardContent className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
                <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                  <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-3800 text-xl tracking-[-0.40px] leading-[normal]">
                    Personal Information
                  </h2>
                  <PersonalInfo />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Identification Section */}
          <section className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-800 text-xl tracking-[-0.40px] leading-[normal]">
                Identification
              </h2>
              <Identification />
            </div>
          </section>

          {/* Income Section */}
          <section className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-800 text-xl tracking-[-0.40px] leading-[normal]">
                Income
              </h2>
              <Income />
            </div>
          </section>

          {/* Residential History Section */}
          <section className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-800 text-xl tracking-[-0.40px] leading-[normal]">
                Residential History
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Please add 24 months of residential history or three previous addresses.
              </p>
              <ResidentialLandlordInfo />
            </div>
          </section>

          {/* Questionnaire Section */}
          <section className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-800 text-xl tracking-[-0.40px] leading-[normal]">
                Questionnaire
              </h2>
              <Questionnaire />
            </div>
          </section>

          {/* Submit Button */}
          <div className="w-full flex justify-center mt-6">
            <Button
              onClick={handleSubmit}
              className="w-full px-8 py-3 bg-[#0b6969] hover:bg-[#085454] text-white font-medium rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

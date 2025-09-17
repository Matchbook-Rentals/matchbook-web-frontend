'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { PAGE_MARGIN, ApplicationItemHeaderStyles } from '@/constants/styles';
import { PersonalInfo } from '../../searches/(trips-components)/application-personal-info';
import { logger } from '@/lib/logger';
import { Identification } from '../../searches/(trips-components)/application-identity';
import { Income } from '../../searches/(trips-components)/application-income';
import Questionnaire from '../../searches/(trips-components)/application-questionnaire';
import { upsertApplication, markComplete, updateApplicationCompletionStatus } from '@/app/actions/applications';
import { useWindowSize } from '@/hooks/useWindowSize'
import {
  validatePersonalInfo,
  validateIdentification,
  validateResidentialHistory,
  validateIncome,
  validateQuestionnaire
} from '@/utils/application-validation';
import { useApplicationStore } from '@/stores/application-store';
import { ResidentialLandlordInfo } from '../../searches/(trips-components)/residential-landlord-info';
import { ScrollArea } from '@/components/ui/scroll-area';
import { checkApplicationCompletionClient } from '@/utils/application-completion';

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
    checkCompletion,
    isApplicationComplete,
    serverIsComplete
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
    // Create a modified personalInfo object that considers noMiddleName checkbox
    const personalInfoForValidation = {
      ...personalInfo,
      // If noMiddleName is checked, treat middleName as satisfied
      middleName: personalInfo.noMiddleName ? 'N/A' : personalInfo.middleName
    };

    const personalInfoError = validatePersonalInfo(personalInfoForValidation);
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
      // Scroll to first error field
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.border-red-500, .text-red-500');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
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
          fileKey: photo.fileKey,
          customId: photo.customId,
          fileName: photo.fileName,
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

          // Redirect to searches page after successful submission
          router.push('/app/rent/searches');
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to save application",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to save application",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="flex flex-col w-full max-w-[1140px] mx-auto items-start justify-center gap-4 p-4">
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
                  <PersonalInfo isMobile={isMobile} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Identification Section */}
          <section className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <Identification isMobile={isMobile} />
            </div>
          </section>

          {/* Income Section */}
          <section className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-800 text-xl tracking-[-0.40px] leading-[normal]">
                Income
              </h2>
              <Income isMobile={isMobile} />
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
              <ResidentialLandlordInfo isMobile={isMobile} />
            </div>
          </section>

          {/* Questionnaire Section */}
          <section className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-800 text-xl tracking-[-0.40px] leading-[normal]">
                Questionnaire
              </h2>
              <Questionnaire isMobile={isMobile} />
            </div>
          </section>

          {/* Submit Button */}
          <div className="w-full flex justify-center mt-6">
            <Button
              onClick={handleSubmit}
              className="w-full px-8 py-3 bg-[#0b6969] hover:bg-[#085454] text-white font-medium rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Save Application'}
            </Button>
          </div>

      {/* Development Troubleshooting Section */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 bg-gray-900 text-white p-4 border-4 border-yellow-500 font-mono text-xs rounded-lg">
          <div className="">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-yellow-400 font-bold text-sm">🔧 DEV TROUBLESHOOTING - Completion Status</h3>
              <button
                onClick={async () => {
                  if (application?.id) {
                    const result = await updateApplicationCompletionStatus(application.id);
                    if (result.success) {
                      toast({
                        title: "Completion Status Updated",
                        description: `Server now reports: ${result.isComplete ? 'Complete' : 'Incomplete'}`,
                        duration: 3000,
                      });
                      // Refresh the page to get updated data
                      window.location.reload();
                    }
                  }
                }}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded text-xs"
              >
                Force Server Check
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Server Status */}
              <div className="bg-gray-800 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">Server Status (Live):</span>
                  <span className={serverIsComplete ? "text-green-400" : "text-red-400"}>
                    {serverIsComplete ? "✅ Complete" : "❌ Incomplete"}
                  </span>
                </div>
                <div className="text-gray-400 text-xs">
                  Initial DB value: {application?.isComplete !== undefined ? application.isComplete.toString() : 'undefined'}
                </div>
                <div className="text-gray-400 text-xs">
                  Live store value: {serverIsComplete.toString()}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  Application ID: {application?.id || 'No application'}
                </div>
              </div>

              {/* Client Status */}
              <div className="bg-gray-800 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">Client Status (Store):</span>
                  <span className={isApplicationComplete() ? "text-green-400" : "text-red-400"}>
                    {isApplicationComplete() ? "✅ Complete" : "❌ Incomplete"}
                  </span>
                </div>
                {(() => {
                  const result = checkApplicationCompletionClient({
                    personalInfo,
                    ids,
                    incomes,
                    answers,
                    residentialHistory
                  });
                  return (
                    <>
                      <div className="text-gray-400 text-xs">
                        Missing ({result.missingRequirements.length}):
                      </div>
                      <div className="text-yellow-300 text-xs mt-1">
                        {result.missingRequirements.length > 0 
                          ? result.missingRequirements.join(", ")
                          : "None"}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Status Mismatch Warning */}
            {serverIsComplete !== isApplicationComplete() && (
              <div className="mt-2 p-2 bg-yellow-900 border border-yellow-600 rounded">
                <span className="text-yellow-300">⚠️ Status Mismatch: </span>
                <span className="text-white">
                  Server says {serverIsComplete ? "complete" : "incomplete"}, 
                  Client says {isApplicationComplete() ? "complete" : "incomplete"}
                </span>
              </div>
            )}

            {/* Debug Info */}
            <div className="mt-2 text-gray-500 text-xs">
              <details>
                <summary className="cursor-pointer hover:text-gray-300">Debug Info (click to expand)</summary>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <strong>Personal Info:</strong>
                    <div>First: {personalInfo.firstName ? "✓" : "✗"}</div>
                    <div>Last: {personalInfo.lastName ? "✓" : "✗"}</div>
                    <div>DOB: {personalInfo.dateOfBirth ? "✓" : "✗"}</div>
                  </div>
                  <div>
                    <strong>IDs:</strong> {ids.length} total
                    <div>Valid: {ids.filter(id => id.idType && id.idNumber && id.idPhotos?.length).length}</div>
                    <strong>Income:</strong> {incomes.length} total
                    <div>Valid: {incomes.filter(i => i.source && i.monthlyAmount).length}</div>
                  </div>
                  <div>
                    <strong>Residential:</strong> {residentialHistory.length} total
                    <div>First has address: {residentialHistory[0]?.street ? "✓" : "✗"}</div>
                    <div>Housing: {residentialHistory[0]?.housingStatus || "not set"}</div>
                    {residentialHistory[0]?.housingStatus === 'rent' && (
                      <div>Landlord: {residentialHistory[0]?.landlordFirstName ? "✓" : "✗"}</div>
                    )}
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

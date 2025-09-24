'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brandButton";
import { cn } from '@/lib/utils';
import { PAGE_MARGIN, ApplicationItemHeaderStyles } from '@/constants/styles';
import { PersonalInfo } from '../../searches/(trips-components)/application-personal-info';
import { logger } from '@/lib/logger';
import { Identification } from '../../searches/(trips-components)/application-identity';
import { Income } from '../../searches/(trips-components)/application-income';
import Questionnaire from '../../searches/(trips-components)/application-questionnaire';
import { upsertApplication, markComplete, updateApplicationCompletionStatus, deleteIDPhoto, deleteIncomeProof } from '@/app/actions/applications';
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
  isMobile: initialIsMobile = false,
  from
}: {
  application: any | null;
  isMobile?: boolean;
  from?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Handle back navigation
  const handleBack = () => {
    if (from) {
      router.push(from);
    } else {
      router.back();
    }
  };

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
    serverIsComplete,
    errors,
    resetStore
  } = useApplicationStore();

  // Track if we've already initialized to prevent re-initialization
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize store with application data received from the server component
  useEffect(() => {
    // Only initialize once and only if we have application data
    if (application && !hasInitialized) {
      logger.debug('Received user application from server', application);
      initializeFromApplication(application);
      setHasInitialized(true);
    }
    // If no application, the form will show empty (default store state)
  }, [application]); // Removed initializeFromApplication from dependencies

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
    console.log('⏰ === VALIDATION START ===', new Date().toISOString());
    console.log('🏪 Current store errors BEFORE validation:', errors);
    console.log('📊 Form data being validated:', {
      personalInfo,
      ids,
      incomes,
      residentialHistory,
      answers
    });

    // Create a modified personalInfo object that considers noMiddleName checkbox
    const personalInfoForValidation = {
      ...personalInfo,
      // If noMiddleName is checked, treat middleName as satisfied
      middleName: personalInfo.noMiddleName ? 'N/A' : personalInfo.middleName
    };

    console.log('🔄 Personal Info for Validation:', personalInfoForValidation);

    const personalInfoError = validatePersonalInfo(personalInfoForValidation);
    const identificationError = validateIdentification(ids);
    const residentialHistoryErrors = validateResidentialHistory(residentialHistory);
    const incomeErrors = validateIncome(incomes);
    const questionnaireErrors = validateQuestionnaire(answers);

    console.log('🚨 === VALIDATION ERRORS FOUND ===');
    console.log('  Personal Info Errors:', personalInfoError);
    console.log('  Identification Errors:', identificationError);
    console.log('  Residential History Errors:', residentialHistoryErrors);
    console.log('  Income Errors:', incomeErrors);
    console.log('  Questionnaire Errors:', questionnaireErrors);

    // Create fresh errors object for immediate use
    const freshErrors = {
      basicInfo: {
        personalInfo: personalInfoError,
        identification: identificationError,
      },
      residentialHistory: residentialHistoryErrors,
      income: incomeErrors,
      questionnaire: questionnaireErrors,
    };

    console.log('💾 Setting errors in store...');
    setErrors('basicInfo', {
      personalInfo: personalInfoError,
      identification: identificationError,
    });
    setErrors('residentialHistory', residentialHistoryErrors as any);
    setErrors('income', incomeErrors);
    setErrors('questionnaire', questionnaireErrors);

    console.log('✅ Errors set in store at:', new Date().toISOString());

    const isValid = (
      Object.keys(personalInfoError).length === 0 &&
      Object.keys(identificationError).length === 0 &&
      Object.keys(residentialHistoryErrors).length === 0 &&
      Object.keys(incomeErrors).length === 0 &&
      Object.keys(questionnaireErrors).length === 0
    );

    console.log('📋 === VALIDATION RESULT ===');
    console.log('  Personal Info Valid:', Object.keys(personalInfoError).length === 0);
    console.log('  Identification Valid:', Object.keys(identificationError).length === 0);
    console.log('  Residential History Valid:', Object.keys(residentialHistoryErrors).length === 0);
    console.log('  Income Valid:', Object.keys(incomeErrors).length === 0);
    console.log('  Questionnaire Valid:', Object.keys(questionnaireErrors).length === 0);
    console.log('  Overall Is Valid:', isValid);
    console.log('⚡ Validation completed at:', new Date().toISOString());
    console.log('=========================');

    return { isValid, errors: freshErrors };
  };

  const getFieldDisplayNames = () => {
    return {
      // Personal Information
      firstName: "First Name",
      lastName: "Last Name",
      middleName: "Middle Name",
      dateOfBirth: "Date of Birth",

      // Identification
      idType: "ID Type",
      idNumber: "ID Number",
      isPrimary: "Primary ID",
      idPhotos: "ID Photos",
      primaryPhoto: "Primary Photo",

      // Income
      source: "Income Source",
      monthlyAmount: "Monthly Amount",
      imageUrl: "Income Proof",

      // Residential History
      street: "Street Address",
      apt: "Apartment",
      city: "City",
      state: "State",
      zipCode: "ZIP Code",
      monthlyPayment: "Monthly Payment",
      durationOfTenancy: "Length of Stay",
      landlordFirstName: "Landlord First Name",
      landlordLastName: "Landlord Last Name",
      landlordEmail: "Landlord Email",
      landlordPhoneNumber: "Landlord Phone",

      // Questionnaire
      felony: "Criminal History Question",
      felonyExplanation: "Criminal History Explanation",
      evicted: "Eviction History Question",
      evictedExplanation: "Eviction History Explanation"
    };
  };

  const getErrorFieldsForSection = (sectionName: string, freshErrors?: any) => {
    const fieldNames = getFieldDisplayNames();
    const errorFields: string[] = [];

    // Use fresh errors if provided, otherwise fall back to store errors
    const errorsToUse = freshErrors || errors;

    switch (sectionName) {
      case 'Personal Information':
        const personalInfoErrors = errorsToUse.basicInfo?.personalInfo || {};

        Object.keys(personalInfoErrors).forEach(key => {
          // Check that the error has a value and the field name exists
          if (personalInfoErrors[key as keyof typeof personalInfoErrors] && fieldNames[key as keyof typeof fieldNames]) {
            const fieldName = fieldNames[key as keyof typeof fieldNames];
            // Avoid duplicates
            if (!errorFields.includes(fieldName)) {
              errorFields.push(fieldName);
            }
          }
        });
        break;

      case 'Identification':
        const identificationErrors = errorsToUse.basicInfo?.identification || {};

        Object.keys(identificationErrors).forEach(key => {
          // Check that the error has a value and the field name exists
          if (identificationErrors[key as keyof typeof identificationErrors] && fieldNames[key as keyof typeof fieldNames]) {
            const fieldName = fieldNames[key as keyof typeof fieldNames];
            // Avoid duplicates
            if (!errorFields.includes(fieldName)) {
              errorFields.push(fieldName);
            }
          }
        });
        break;

      case 'Income':
        const incomeErrors = errorsToUse.income || {};

        // Handle array-based income errors
        if (incomeErrors.source) {
          incomeErrors.source.forEach((error, index) => {
            if (error) errorFields.push(`Income Source ${index + 1}`);
          });
        }
        if (incomeErrors.monthlyAmount) {
          incomeErrors.monthlyAmount.forEach((error, index) => {
            if (error) errorFields.push(`Monthly Amount ${index + 1}`);
          });
        }
        if (incomeErrors.imageUrl) {
          incomeErrors.imageUrl.forEach((error, index) => {
            if (error) errorFields.push(`Income Proof ${index + 1}`);
          });
        }
        break;

      case 'Residential History':
        const residentialErrors = errorsToUse.residentialHistory || {};

        // Handle array-based residential history errors
        Object.keys(residentialErrors).forEach(key => {
          if (key === 'overall' && residentialErrors.overall) {
            errorFields.push('Residential Duration');
          } else if (Array.isArray(residentialErrors[key as keyof typeof residentialErrors])) {
            const errorArray = residentialErrors[key as keyof typeof residentialErrors] as string[];
            errorArray.forEach((error, index) => {
              if (error) {
                const displayName = fieldNames[key as keyof typeof fieldNames];
                if (displayName) {
                  errorFields.push(`${displayName} ${index + 1}`);
                }
              }
            });
          }
        });
        break;

      case 'Questionnaire':
        const questionnaireErrors = errorsToUse.questionnaire || {};

        Object.keys(questionnaireErrors).forEach(key => {
          // Check that the error has a value and the field name exists
          if (questionnaireErrors[key as keyof typeof questionnaireErrors] && fieldNames[key as keyof typeof fieldNames]) {
            const fieldName = fieldNames[key as keyof typeof fieldNames];
            // Avoid duplicates
            if (!errorFields.includes(fieldName)) {
              errorFields.push(fieldName);
            }
          }
        });
        break;
    }

    // Remove duplicates and filter out empty strings
    const finalErrorFields = [...new Set(errorFields.filter(field => field && field.trim()))];
    return finalErrorFields;
  };

  // Check if a section has errors using the same logic as UI components 
  const hasErrorsInSection = (sectionName: string, errors: any): boolean => {
    switch (sectionName) {
      case 'Personal Information':
        const personalErrors = errors.basicInfo?.personalInfo || {};
        const hasPersonalErrors = Object.values(personalErrors).some((error: any) => error && error !== '');
        return hasPersonalErrors;

      case 'Identification':
        const identificationErrors = errors.basicInfo?.identification || {};
        const hasIdentificationErrors = Object.values(identificationErrors).some((error: any) => error && error !== '');
        return hasIdentificationErrors;

      case 'Residential History':
        const residentialErrors = errors.residentialHistory || {};
        let hasResidentialErrors = false;

        // Check main fields (excluding array fields)
        Object.entries(residentialErrors).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Array field like street[], city[], etc.
            if (value.some((error: any) => error && error !== '')) {
              hasResidentialErrors = true;
            }
          } else if (value && value !== '') {
            // Simple field like overall
            hasResidentialErrors = true;
          }
        });

        return hasResidentialErrors;

      case 'Income':
        const incomeErrors = errors.income || {};
        let hasIncomeErrors = false;

        // Check array-based income errors
        ['source', 'monthlyAmount', 'imageUrl'].forEach(field => {
          if (incomeErrors[field] && Array.isArray(incomeErrors[field])) {
            if (incomeErrors[field].some((error: any) => error && error !== '')) {
              hasIncomeErrors = true;
            }
          }
        });

        return hasIncomeErrors;

      case 'Questionnaire':
        const questionnaireErrors = errors.questionnaire || {};
        const hasQuestionnaireErrors = Object.values(questionnaireErrors).some((error: any) => error && error !== '');
        return hasQuestionnaireErrors;

      default:
        return false;
    }
  };

  const findFirstErrorSection = (freshErrors: any) => {
    const sectionMap = [
      { name: 'Personal Information', selector: '[data-section="personal-info"]' },
      { name: 'Identification', selector: '[data-section="identification"]' },
      { name: 'Income', selector: '[data-section="income"]' },
      { name: 'Residential History', selector: '[data-section="residential-history"]' },
      { name: 'Questionnaire', selector: '[data-section="questionnaire"]' }
    ];

    for (const section of sectionMap) {
      // Use fresh errors instead of store errors
      if (hasErrorsInSection(section.name, freshErrors)) {
        const sectionElement = document.querySelector(section.selector);
        const errorFields = getErrorFieldsForSection(section.name, freshErrors);

        return {
          name: section.name,
          element: sectionElement,
          errorFields: errorFields
        };
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationResult = validateForm();

    if (!validationResult.isValid) {
      // Find the first error section and scroll to it
      setTimeout(() => {
        const firstErrorInfo = findFirstErrorSection(validationResult.errors);
        if (firstErrorInfo) {
          firstErrorInfo.element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Create specific, actionable error message
          let title = "Missing Required Information";
          let errorMessage = `Please complete the ${firstErrorInfo.name} section.`;

          if (firstErrorInfo.errorFields && firstErrorInfo.errorFields.length > 0) {
            const firstField = firstErrorInfo.errorFields[0];
            const remainingCount = firstErrorInfo.errorFields.length - 1;

            // Create actionable message based on the first error field
            if (firstField.includes("First Name")) {
              errorMessage = "Please enter your first name to continue.";
            } else if (firstField.includes("Last Name")) {
              errorMessage = "Please enter your last name to continue.";
            } else if (firstField.includes("Date of Birth")) {
              errorMessage = "Please enter your date of birth to continue.";
            } else if (firstField.includes("Income Source")) {
              errorMessage = "Please enter your income source to continue.";
            } else if (firstField.includes("Monthly Amount")) {
              errorMessage = "Please enter your monthly income amount to continue.";
            } else if (firstField.includes("Income Proof")) {
              errorMessage = "Please upload proof of income to continue.";
            } else if (firstField.includes("ID Type")) {
              errorMessage = "Please select your ID type to continue.";
            } else if (firstField.includes("ID Number")) {
              errorMessage = "Please enter your ID number to continue.";
            } else if (firstField.includes("Street Address")) {
              errorMessage = "Please enter your street address to continue.";
            } else {
              errorMessage = `Please enter your ${firstField.toLowerCase()} to continue.`;
            }

          }

          toast({
            title: title,
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          console.log('❌❌❌ VALIDATION FAILED BUT NO ERROR SECTION FOUND ❌❌❌');
          console.log('❌❌❌ FRESH ERRORS:', validationResult.errors);
          console.log('❌❌❌ VALIDATION RESULT:', validationResult);

          // Fallback to original behavior
          const firstErrorElement = document.querySelector('.border-red-500, .text-red-500');
          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }

          toast({
            title: "Validation Error",
            description: "Please correct errors before submitting.",
            variant: "destructive",
          });
        }
      }, 100);
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
    <div className='bg-gray-50'>
      <div className="flex flex-col w-full max-w-[1200px] mx-auto items-start justify-center gap-4 p-4">
        {/* Header Section */}
        <div className="flex items-start gap-6 py-0 w-full">
          <div className="flex items-center justify-start gap-3 w-full">
            <BrandButton
              variant="outline"
              onClick={handleBack}
              className="flex items-center justify-center w-[77px] h-[44px] rounded-lg border border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white"
            >
              <div className="[font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap">
                Back
              </div>
            </BrandButton>

            <div className="flex-1">
              <div className="flex flex-col items-start gap-2">
                <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
                  General Application
                </h1>
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#727A90] text-base tracking-[0] leading-6">
                  This application will be used when you apply to new listings
                </p>
              </div>
            </div>
          </div>
        </div>

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
        <section data-section="personal-info" className="flex flex-col items-center justify-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
          <Card className="flex flex-col items-center justify-center gap-8 relative self-stretch w-full flex-[0_0_auto] rounded-2xl overflow-hidden border-none shadow-none">
            <CardContent className="flex flex-col items-start gap-8 px-0 py-6 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
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
        <section data-section="identification" className="flex flex-col items-start gap-8 p-0 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
          <div className="flex flex-col items-start gap-5 relative self-stretch w-full  flex-[0_0_auto]">
            <Identification isMobile={isMobile} />
          </div>
        </section>

        {/* Income Section */}
        <section data-section="income" className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
          <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-800 text-xl tracking-[-0.40px] leading-[normal]">
              Income
            </h2>
            <Income isMobile={isMobile} />
          </div>
        </section>

        {/* Residential History Section */}
        <section data-section="residential-history" className="flex flex-col items-start gap-8  relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
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
        <section data-section="questionnaire" className="flex flex-col items-start gap-8  relative self-stretch w-full flex-[0_0_auto] bg-neutral-50 rounded-xl">
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
            className="w-full max-w-[400px] px-8 py-3 bg-[#0b6969] hover:bg-[#085454] text-white font-medium rounded-lg"
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
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      // Clear temp data only (no photos)
                      resetStore();
                      toast({
                        title: "Temp Data Cleared",
                        description: "Form data reset (photos preserved)",
                        duration: 3000,
                      });
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs"
                  >
                    Clear Temp Data
                  </button>
                  <button
                    onClick={async () => {
                      // Clear all data including photos
                      const confirmClear = window.confirm("This will delete ALL data including uploaded photos. Are you sure?");
                      if (!confirmClear) return;

                      try {
                        // Delete all ID photos
                        for (const id of ids) {
                          if (id.idPhotos) {
                            for (const photo of id.idPhotos) {
                              if (photo.id) {
                                await deleteIDPhoto(photo.id);
                              }
                            }
                          }
                        }

                        // Delete all income proofs
                        for (const income of incomes) {
                          if (income.id) {
                            await deleteIncomeProof(income.id);
                          }
                        }

                        // Reset the store
                        resetStore();

                        toast({
                          title: "All Data Cleared",
                          description: "All form data and photos deleted",
                          duration: 3000,
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to delete some files",
                          variant: "destructive",
                          duration: 3000,
                        });
                      }
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs"
                  >
                    Clear All
                  </button>
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
    </div>
  );
}

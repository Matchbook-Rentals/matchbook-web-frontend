'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { PAGE_MARGIN, ApplicationItemHeaderStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';
import { PersonalInfo } from './application-personal-info';
import { Identification } from './application-identity';
import { ResidentialHistory } from './application-resident-history';
import { ResidentialLandlordInfo } from './residential-landlord-info';
import { Income } from './application-income';
import Questionnaire from './application-questionnaire';
import { upsertApplication, markComplete, getFullApplication } from '@/app/actions/applications';
import { useApplicationStore } from '@/stores/application-store';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  validatePersonalInfo,
  validateIdentification,
  validateResidentialHistory,
  validateIncome,
  validateQuestionnaire
} from '@/utils/application-validation';

export default function MobileApplicationEdit({ application }: { application?: any | null }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id') || (params.tripId ? `${params.tripId}_application` : undefined);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [openAccordion, setOpenAccordion] = useState<string>('___closed');

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
    // If application prop is provided (from parent), use it directly
    if (application) {
      console.log('MobileApplicationEdit - Using application prop from parent:', application);
      initializeFromApplication(application);
      return;
    }
    
    // Otherwise, fetch application data based on context (for trip-specific routes)
    const fetchApplicationData = async () => {
      try {
        // For trip-specific applications
        if (params.tripId) {
          console.log('MobileApplicationEdit - Fetching application for trip:', params.tripId);
          const appId = `${params.tripId}_application`;
          const result = await getFullApplication(appId);
          
          if (result.success && result.application) {
            console.log('MobileApplicationEdit - Fetched trip application:', result.application);
            initializeFromApplication(result.application);
          }
        }
      } catch (error) {
        console.error('MobileApplicationEdit - Error fetching application:', error);
        toast({
          title: "Error",
          description: "Failed to load application data",
          variant: "destructive",
        });
      }
    };
    
    if (!application && params.tripId) {
      fetchApplicationData();
    }
  }, [application, params.tripId, initializeFromApplication, toast]);

  const validateSection = (section: string): boolean => {
    let isValid = true;
    switch (section) {
      case 'basic': {
        const personalInfoError = validatePersonalInfo(personalInfo);
        setErrors('basicInfo', {
          personalInfo: personalInfoError,
          identification: {}, // Clear any previous identification errors
        });
        isValid = Object.keys(personalInfoError).length === 0;
        break;
      }
      case 'identification': {
        const identificationError = validateIdentification(ids);
        setErrors('identification', identificationError);
        isValid = Object.keys(identificationError).length === 0;
        break;
      }
      case 'residential': {
        const residentialHistoryErrors = validateResidentialHistory(residentialHistory);
        setErrors('residentialHistory', residentialHistoryErrors);
        isValid = Object.keys(residentialHistoryErrors).length === 0;
        break;
      }
      case 'income': {
        const incomeErrors = validateIncome(incomes);
        setErrors('income', incomeErrors);
        isValid = Object.keys(incomeErrors).length === 0;
        break;
      }
      case 'questionnaire': {
        const questionnaireErrors = validateQuestionnaire(answers);
        setErrors('questionnaire', questionnaireErrors);
        isValid = Object.keys(questionnaireErrors).length === 0;
        break;
      }
    }
    setValidationErrors(prev => ({ ...prev, [section]: !isValid }));
    return isValid;
  };

  const handleSubmit = async () => {
    // Validate all sections
    const sections = ['basic', 'identification', 'residential', 'income', 'questionnaire'];
    const invalidSections = sections.filter(section => !validateSection(section));

    if (invalidSections.length > 0) {
      setOpenAccordion('___closed'); // close all accordions
      setTimeout(() => {
        setOpenAccordion(invalidSections[0]); // open the first invalid section after 600ms delay
      }, 600);
      toast({
        title: "Validation Error",
        description: "Please correct all errors before submitting.",
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
        idPhotos: id.photos?.length ? {
          create: id.photos.map(photo => ({
            url: photo.url,
            isPrimary: photo.isPrimary
          }))
        } : undefined
      })),
      residentialHistories: residentialHistory,
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
        // Redirect to dashboard after successful submission
        router.push('/app/dashboard');
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


  return (
    <div className={PAGE_MARGIN}>
      <div className="w-full max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={(value) => setOpenAccordion(value === '' ? '___closed' : value)}>
          <AccordionItem value="___closed" className="hidden">
            <AccordionTrigger className="hidden" />
            <AccordionContent className="hidden" />
          </AccordionItem>

          <AccordionItem
            value="basic"
            className={cn(
              "border rounded-lg mb-4",
              validationErrors.basic && "border-red-500"
            )}
          >
            <AccordionTrigger className="px-4">Basic Information</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <PersonalInfo />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="identification"
            className={cn(
              "border rounded-lg mb-4",
              validationErrors.identification && "border-red-500"
            )}
          >
            <AccordionTrigger className="px-4">Identification</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Identification />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="residential"
            className={cn(
              "border rounded-lg mb-4",
              validationErrors.residential && "border-red-500"
            )}
          >
            <AccordionTrigger className="px-4">Residential History</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ResidentialLandlordInfo />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="income"
            className={cn(
              "border rounded-lg mb-4",
              validationErrors.income && "border-red-500"
            )}
          >
            <AccordionTrigger className="px-4">Income</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Income />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="questionnaire"
            className={cn(
              "border rounded-lg mb-4",
              validationErrors.questionnaire && "border-red-500"
            )}
          >
            <AccordionTrigger className="px-4">Questionnaire</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Questionnaire />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button
          onClick={handleSubmit}
          className="w-full mt-6"
          disabled={isLoading || !isEdited()}
        >
          {isLoading ? "Submitting..." : isEdited() ? "Submit Application" : "No Changes"}
        </Button>
      </div>
    </div>
  );
}
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { PAGE_MARGIN, ApplicationItemHeaderStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';
import { PersonalInfo } from './application-personal-info';
import { Identification } from './application-identity';
import { ResidentialHistory } from './application-resident-history';
import { LandlordInfo } from './application-landlord-info';
import { Income } from './application-income';
import Questionnaire from './application-questionnaire';
import { upsertApplication, markComplete } from '@/app/actions/applications';
import { useApplicationStore } from '@/stores/application-store';
import { useTripContext } from '@/contexts/trip-context-provider';
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
  validateLandlordInfo,
  validateIncome,
  validateQuestionnaire
} from '@/utils/application-validation';

export default function MobileApplicationEdit() {
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();
  const { state: { trip, application }, actions: { setHasApplication } } = useTripContext();
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
    initializeFromApplication(application);
  }, [application, initializeFromApplication]);

  const validateSection = (section: string): boolean => {
    let isValid = true;
    switch (section) {
      case 'basic': {
        const personalInfoError = validatePersonalInfo(personalInfo);
        const identificationError = validateIdentification(ids);
        setErrors('basicInfo', {
          personalInfo: personalInfoError,
          identification: identificationError,
        });
        isValid = Object.keys(personalInfoError).length === 0 &&
                 Object.keys(identificationError).length === 0;
        break;
      }
      case 'residential': {
        const residentialHistoryErrors = validateResidentialHistory(residentialHistory);
        const landlordInfoErrors = residentialHistory.housingStatus === 'rent'
          ? validateLandlordInfo(landlordInfo)
          : {};
        setErrors('residentialHistory', residentialHistoryErrors);
        setErrors('landlordInfo', landlordInfoErrors);
        isValid = Object.keys(residentialHistoryErrors).length === 0 &&
                 (residentialHistory.housingStatus !== 'rent' || Object.keys(landlordInfoErrors).length === 0);
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
    const sections = ['basic', 'residential', 'income', 'questionnaire'];
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
              <div className="mt-8">
                <h3 className={ApplicationItemSubHeaderStyles}>Identification</h3>
                <Identification />
              </div>
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
              <ResidentialHistory />
              <LandlordInfo />
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
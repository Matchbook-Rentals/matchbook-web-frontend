'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ListingAndImages } from '@/types';
import { PersonalInfo } from '@/app/app/rent/searches/(trips-components)/application-personal-info';
import { Identification } from '@/app/app/rent/searches/(trips-components)/application-identity';
import { Income } from '@/app/app/rent/searches/(trips-components)/application-income';
import Questionnaire from '@/app/app/rent/searches/(trips-components)/application-questionnaire';
import { ResidentialLandlordInfo } from '@/app/app/rent/searches/(trips-components)/residential-landlord-info';
import { useApplicationStore } from '@/stores/application-store';
import { upsertApplication, markComplete, getFullApplication } from '@/app/actions/applications';
import { applyToListingFromSearch } from '@/app/actions/housing-requests';
import {
  validatePersonalInfo,
  validateIdentification,
  validateResidentialHistory,
  validateIncome,
  validateQuestionnaire,
} from '@/utils/application-validation';
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator';
import { ApplicationItemHeaderStyles } from '@/constants/styles';
import { TripContextDisplay } from '@/app/app/rent/searches/(trips-components)/trip-context-display';

const INPUT_CLASS_NAME = `
  flex h-12 items-center gap-2 px-3 py-2
  relative self-stretch w-full
  bg-background rounded-lg border border-solid border-[#d0d5dd]
  shadow-shadows-shadow-xs
  text-gray-900
  placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
`.trim().replace(/\s+/g, ' ');

interface ApplicationWizardProps {
  listing: ListingAndImages;
  tripContext: {
    tripId?: string;
    startDate: Date;
    endDate: Date;
    numAdults?: number;
    numChildren?: number;
    numPets?: number;
  };
  application: any;
  onBack: () => void;
  onComplete: () => void;
}

export default function ApplicationWizard({
  listing,
  tripContext,
  application,
  onBack,
  onComplete,
}: ApplicationWizardProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    personalInfo,
    ids,
    residentialHistory,
    incomes,
    answers,
    initializeFromApplication,
    resetStore,
    setErrors,
    markSynced,
  } = useApplicationStore();

  useEffect(() => {
    resetStore();
    if (application) {
      initializeFromApplication(application);
    }

    const fetchFull = async () => {
      if (application?.id) {
        const result = await getFullApplication(application.id);
        if (result.success && result.application) {
          initializeFromApplication(result.application);
        }
      }
    };
    fetchFull();
  }, [application, initializeFromApplication, resetStore]);

  const getFirstErrorMessage = (errors: any): string | null => {
    if (errors.personalInfo) {
      const first = Object.values(errors.personalInfo)[0];
      if (first) return first as string;
    }
    if (errors.identification) {
      const first = Object.values(errors.identification)[0];
      if (first) return first as string;
    }
    if (errors.overall) return errors.overall;

    const arrayFields = [
      'street', 'city', 'state', 'zipCode', 'monthlyPayment', 'durationOfTenancy',
      'landlordFirstName', 'landlordLastName', 'landlordEmail', 'landlordPhoneNumber',
    ];
    for (const field of arrayFields) {
      if (errors[field] && Array.isArray(errors[field])) {
        const first = errors[field].find((e: any) => e);
        if (first) return first;
      }
    }
    if (errors.source && Array.isArray(errors.source)) {
      const first = errors.source.find((e: any) => e);
      if (first) return first;
    }
    if (errors.monthlyAmount && Array.isArray(errors.monthlyAmount)) {
      const first = errors.monthlyAmount.find((e: any) => e);
      if (first) return first;
    }
    if (errors.felony) return errors.felony;
    if (errors.evicted) return errors.evicted;

    const firstString = Object.values(errors).find((e) => typeof e === 'string');
    if (firstString) return firstString as string;
    return null;
  };

  const validateAll = useCallback(
    (): { isValid: boolean; errorMessage: string | null } => {
      // Validate basic info
      const piErrors = validatePersonalInfo(personalInfo);
      const idErrors = validateIdentification(ids);
      const basicErrors = { personalInfo: piErrors, identification: idErrors };
      setErrors('basicInfo', basicErrors);

      // Validate residential history
      const resErrors = validateResidentialHistory(residentialHistory);
      setErrors('residentialHistory', resErrors as any);

      // Validate income
      const incErrors = validateIncome(incomes);
      setErrors('income', incErrors);

      // Validate questionnaire
      const qErrors = validateQuestionnaire(answers);
      setErrors('questionnaire', qErrors);

      const basicValid = Object.keys(piErrors).length === 0 && Object.keys(idErrors).length === 0;
      const resValid = Object.keys(resErrors).length === 0;
      const incValid = Object.keys(incErrors).length === 0;
      const qValid = Object.keys(qErrors).length === 0;

      const isValid = basicValid && resValid && incValid && qValid;

      let errorMessage: string | null = null;
      if (!basicValid) errorMessage = getFirstErrorMessage(basicErrors);
      else if (!resValid) errorMessage = getFirstErrorMessage(resErrors);
      else if (!incValid) errorMessage = getFirstErrorMessage(incErrors);
      else if (!qValid) errorMessage = getFirstErrorMessage(qErrors);

      return { isValid, errorMessage };
    },
    [personalInfo, ids, residentialHistory, incomes, answers, setErrors]
  );

  const buildApplicationData = () => {
    const formattedDateOfBirth = personalInfo.dateOfBirth
      ? new Date(personalInfo.dateOfBirth).toISOString()
      : undefined;

    return {
      ...personalInfo,
      dateOfBirth: formattedDateOfBirth,
      ...answers,
      incomes,
      identifications: ids.map((id) => ({
        id: id.id,
        idType: id.idType,
        idNumber: id.idNumber,
        isPrimary: id.isPrimary,
        idPhotos: id.idPhotos?.length
          ? id.idPhotos.map((photo) => ({
              url: photo.url,
              fileKey: photo.fileKey,
              customId: photo.customId,
              fileName: photo.fileName,
              isPrimary: photo.isPrimary,
            }))
          : undefined,
      })),
      residentialHistories: residentialHistory,
    };
  };

  const handleSubmit = async () => {
    // Validate all sections
    const validation = validateAll();
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: validation.errorMessage || 'Please correct errors before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. First create/get the trip (this may create one if tripId is missing)
      const applyResult = await applyToListingFromSearch(listing.id, {
        tripId: tripContext.tripId,
        startDate: tripContext.startDate,
        endDate: tripContext.endDate,
      });

      if (!applyResult.success) {
        toast({
          title: 'Error',
          description: applyResult.error || 'Failed to submit application',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Now we have a guaranteed tripId - save the trip-specific application
      const applicationData = buildApplicationData();
      const upsertResult = await upsertApplication({
        ...applicationData,
        tripId: applyResult.tripId, // Use the returned tripId (guaranteed to exist)
      });

      if (!upsertResult.success) {
        toast({ title: 'Error', description: 'Failed to save application', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      markSynced();

      // 3. Mark as complete
      if (upsertResult.application?.id) {
        await markComplete(upsertResult.application.id);
      }

      toast({ title: 'Success', description: 'Application submitted successfully!' });
      onComplete();
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-24">
      <SaveStatusIndicator />

      {/* Trip Context Display */}
      <div className="mb-10">
        <TripContextDisplay
          startDate={tripContext.startDate}
          endDate={tripContext.endDate}
          numAdults={tripContext.numAdults ?? 1}
          numChildren={tripContext.numChildren ?? 0}
          numPets={tripContext.numPets ?? 0}
        />
      </div>

      {/* All form sections */}
      <div className="space-y-10">
        <div>
          <h2 className={ApplicationItemHeaderStyles}>Basic Information</h2>
          <PersonalInfo inputClassName={INPUT_CLASS_NAME} />
          <div className="mt-8">
            <Identification inputClassName={INPUT_CLASS_NAME} />
          </div>
        </div>

        <div>
          <h2 className={cn(ApplicationItemHeaderStyles, 'mb-1')}>Residential History</h2>
          <p className="text-sm text-gray-500 mb-4">
            Please add 24 months of residential history or three previous addresses.
          </p>
          <ResidentialLandlordInfo inputClassName={INPUT_CLASS_NAME} />
        </div>

        <div>
          <h2 className={ApplicationItemHeaderStyles}>Income</h2>
          <Income inputClassName={INPUT_CLASS_NAME} />
        </div>

        <div>
          <h2 className={ApplicationItemHeaderStyles}>Questionnaire</h2>
          <Questionnaire />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 p-4 z-20">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back to Listing
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#3c8787] hover:bg-[#2d6b6b] text-white font-semibold px-8"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useApplicationStore } from '@/stores/application-store';
import { ApplicationItemInputStyles, ApplicationItemLabelStyles } from '@/constants/styles';
import { useToast } from "@/components/ui/use-toast";

interface QuestionnaireProps {
  isMobile?: boolean;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ isMobile = false }) => {
  const { toast } = useToast();
  const { 
    answers, 
    setAnswers, 
    errors,
    fieldErrors,
    saveField,
    validateField,
    setFieldError,
    clearFieldError
  } = useApplicationStore();
  const error = errors.questionnaire;
  const felonyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const evictedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // State flags to trigger autofocus only when the user clicks "Yes"
  const [shouldFocusFelony, setShouldFocusFelony] = useState(false);
  const [shouldFocusEvicted, setShouldFocusEvicted] = useState(false);
  

  const handleChange = async (question: string, value: string | boolean) => {
    const fieldPath = `questionnaire.${question}`;
    
    // Update local state immediately
    setAnswers({
      ...answers,
      [question]: value
    });
    
    // Validate and save
    const validationError = validateField(fieldPath, value);
    if (validationError) {
      setFieldError(fieldPath, validationError);
      if (isDevelopment) {
        console.log(`[Questionnaire] Validation error for ${fieldPath}:`, validationError);
      }
    } else {
      clearFieldError(fieldPath);
      // Validate related explanation fields for boolean values
      if (typeof value === 'boolean') {
        // If setting to true (Yes), immediately validate the explanation field
        if (value === true) {
          const explanationField = question === 'felony' ? 'felonyExplanation' : 'evictedExplanation';
          const explanationPath = `questionnaire.${explanationField}`;
          const currentExplanation = answers[explanationField as keyof typeof answers];
          
          // Validate the explanation field
          const explanationError = validateField(explanationPath, currentExplanation);
          if (explanationError) {
            setFieldError(explanationPath, explanationError);
            if (isDevelopment) {
              console.log(`[Questionnaire] Missing explanation for ${question}`);
            }
          } else {
            clearFieldError(explanationPath);
          }
        } else {
          // If setting to false (No), clear any explanation errors
          const explanationField = question === 'felony' ? 'felonyExplanation' : 'evictedExplanation';
          const explanationPath = `questionnaire.${explanationField}`;
          clearFieldError(explanationPath);
        }
        
        if (isDevelopment) {
          console.log(`[Questionnaire] Field ${fieldPath} validated successfully (no auto-save)`);
        }
      } else {
        // For text fields, validate only (no auto-save)
        if (isDevelopment) {
          console.log(`[Questionnaire] Field ${fieldPath} validated successfully (no auto-save)`);
        }
      }
    }
  };

  useEffect(() => {
    // Only focus if the user explicitly selected "Yes"
    if (shouldFocusFelony && answers.felony && felonyTextareaRef.current) {
      felonyTextareaRef.current.focus();
      const length = answers.felonyExplanation?.length || 0;
      felonyTextareaRef.current.setSelectionRange(length, length);
      setShouldFocusFelony(false); // reset the flag
    }
  }, [shouldFocusFelony, answers.felony, answers.felonyExplanation]);

  useEffect(() => {
    // Only focus if the user explicitly selected "Yes"
    if (shouldFocusEvicted && answers.evicted && evictedTextareaRef.current) {
      evictedTextareaRef.current.focus();
      const length = answers.evictedExplanation?.length || 0;
      evictedTextareaRef.current.setSelectionRange(length, length);
      setShouldFocusEvicted(false); // reset the flag
    }
  }, [shouldFocusEvicted, answers.evicted, answers.evictedExplanation]);

  return (
    <div className="w-full">
      <div>
        <div className="mb-6">
          <div className={`${isMobile ? 'flex-col space-y-3' : 'flex space-x-4 items-center'} mb-2`}>
            <div className={`${isMobile ? 'w-full' : 'w-4/5'} flex items-center`}>
              <span className={ApplicationItemLabelStyles}>
                Have you been convicted of a felony or misdemeanor offense in the past 7 years?
              </span>
            </div>
            <div className="flex flex-col">
              <RadioGroup
                onValueChange={(value) => {
                  handleChange('felony', value === 'true');
                  if (value === 'true') {
                    setShouldFocusFelony(true);
                  }
                }}
                value={answers.felony === null ? undefined : answers.felony.toString()}
                className={`flex items-center ${isMobile ? 'gap-4' : 'gap-6'} relative self-stretch w-full flex-[0_0_auto]`}
              >
                <div className="flex items-center gap-2 relative">
                  <RadioGroupItem 
                    value="true" 
                    id="felony-yes" 
                    className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0" 
                  />
                  <Label
                    htmlFor="felony-yes"
                    className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center gap-2 relative">
                  <RadioGroupItem 
                    value="false" 
                    id="felony-no" 
                    className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0" 
                  />
                  <Label
                    htmlFor="felony-no"
                    className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                  >
                    No
                  </Label>
                </div>
              </RadioGroup>
              {error?.felony && (
                <p className="mt-1 text-red-500 text-sm text-center">{error.felony}</p>
              )}
            </div>
          </div>
          {answers.felony && (
            <div className="mt-2">
              <Label htmlFor="felonyExplanation" className="text-[14px] sm:text-[16px] font-normal mb-2 block">
                Please provide the date, and nature of the conviction.
              </Label>
              <Textarea
                ref={felonyTextareaRef}
                id="felonyExplanation"
                className={`mt-1 text-md ${ApplicationItemInputStyles} ${
                  (fieldErrors['questionnaire.felonyExplanation'] || error?.felonyExplanation) ? "border-red-500" : ""
                }`}
                value={answers.felonyExplanation || ''}
                onChange={(e) => {
                  handleChange('felonyExplanation', e.target.value);
                  // Clear error immediately when user starts typing
                  if (e.target.value.trim() && fieldErrors['questionnaire.felonyExplanation']) {
                    clearFieldError('questionnaire.felonyExplanation');
                  }
                }}
                placeholder="Please provide details about the conviction"
              />
              {(fieldErrors['questionnaire.felonyExplanation'] || error?.felonyExplanation) && (
                <p className="mt-1 text-red-500 text-sm font-medium">
                  {fieldErrors['questionnaire.felonyExplanation'] || error.felonyExplanation}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className={`${isMobile ? 'flex-col space-y-3' : 'flex space-x-4 items-center'} mb-6`}>
            <div className={`${isMobile ? 'w-full' : 'w-4/5'} flex items-center`}>
              <span className={ApplicationItemLabelStyles}>
                Have you been evicted from a rental property in the past 7 years?
              </span>
            </div>
            <div className="flex flex-col">
              <RadioGroup
                onValueChange={(value) => {
                  handleChange('evicted', value === 'true');
                  if (value === 'true') {
                    setShouldFocusEvicted(true);
                  }
                }}
                value={answers.evicted === null ? undefined : answers.evicted.toString()}
                className={`flex items-center ${isMobile ? 'gap-4' : 'gap-6'} relative self-stretch w-full flex-[0_0_auto]`}
              >
                <div className="flex items-center gap-2 relative">
                  <RadioGroupItem 
                    value="true" 
                    id="evicted-yes" 
                    className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0" 
                  />
                  <Label
                    htmlFor="evicted-yes"
                    className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center gap-2 relative">
                  <RadioGroupItem 
                    value="false" 
                    id="evicted-no" 
                    className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0" 
                  />
                  <Label
                    htmlFor="evicted-no"
                    className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                  >
                    No
                  </Label>
                </div>
              </RadioGroup>
              {(fieldErrors['questionnaire.evicted'] || error?.evicted) && (
                <p className="mt-1 text-red-500 text-md text-center">{fieldErrors['questionnaire.evicted'] || error.evicted}</p>
              )}
            </div>
          </div>
          {answers.evicted && (
            <div className="mt-2">
              <Label
                htmlFor="evictedExplanation"
                className="text-[14px] sm:text-[16px] font-normal mb-2 block"
              >
                Please explain the circumstances surrounding the eviction, including the reason for the eviction, and the outcome.
              </Label>
              <Textarea
                ref={evictedTextareaRef}
                id="evictedExplanation"
                className={`mt-1 text-md ${ApplicationItemInputStyles} ${
                  (fieldErrors['questionnaire.evictedExplanation'] || error?.evictedExplanation) ? "border-red-500" : ""
                }`}
                value={answers.evictedExplanation || ''}
                onChange={(e) => {
                  handleChange('evictedExplanation', e.target.value);
                  // Clear error immediately when user starts typing
                  if (e.target.value.trim() && fieldErrors['questionnaire.evictedExplanation']) {
                    clearFieldError('questionnaire.evictedExplanation');
                  }
                }}
                placeholder="Please explain the circumstances"
              />
              {(fieldErrors['questionnaire.evictedExplanation'] || error?.evictedExplanation) && (
                <p className="mt-1 text-red-500 text-sm font-medium">
                  {fieldErrors['questionnaire.evictedExplanation'] || error.evictedExplanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;

import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useApplicationStore } from '@/stores/application-store';
import { ApplicationItemInputStyles, ApplicationItemLabelStyles } from '@/constants/styles';

const Questionnaire: React.FC = () => {
  const { answers, setAnswers, errors } = useApplicationStore();
  const error = errors.questionnaire;
  const felonyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const evictedTextareaRef = useRef<HTMLTextAreaElement>(null);

  // State flags to trigger autofocus only when the user clicks "Yes"
  const [shouldFocusFelony, setShouldFocusFelony] = useState(false);
  const [shouldFocusEvicted, setShouldFocusEvicted] = useState(false);

  const handleChange = (question: string, value: string | boolean) => {
    setAnswers({
      ...answers,
      [question]: value
    });
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
          <div className="flex mb-2 space-x-4 items-center">
            <div className="w-4/5 flex items-center">
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
                value={answers.felony?.toString()}
                className="flex justify-center space-x-2"
              >
                <div className="flex items-center space-x-1 ">
                  <RadioGroupItem value="true" id="felony-yes" />
                  <Label
                    className="text-[16px] md:text-[18px] lg:text-[20px] mt-2 cursor-pointer font-normal"
                    htmlFor="felony-yes"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="false" id="felony-no" />
                  <Label
                    className="text-[16px] md:text-[18px] lg:text-[20px] mt-2 cursor-pointer font-normal"
                    htmlFor="felony-no"
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
                  error?.felonyExplanation ? "border-red-500" : ""
                }`}
                value={answers.felonyExplanation || ''}
                onChange={(e) => handleChange('felonyExplanation', e.target.value)}
                placeholder=""
              />
              {error?.felonyExplanation && (
                <p className="mt-1 text-red-500 text-sm">{error.felonyExplanation}</p>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex mb-6 space-x-4 items-center">
            <div className="w-4/5 flex items-center">
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
                value={answers.evicted?.toString()}
                className="flex justify-center space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="true" id="evicted-yes" />
                  <Label
                    className="text-[16px] md:text-[18px] lg:text-[20px] mt-2 cursor-pointer font-normal"
                    htmlFor="evicted-yes"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="false" id="evicted-no" />
                  <Label
                    className="text-[16px] md:text-[18px] lg:text-[20px] mt-2 cursor-pointer font-normal"
                    htmlFor="evicted-no"
                  >
                    No
                  </Label>
                </div>
              </RadioGroup>
              {error?.evicted && (
                <p className="mt-1 text-red-500 text-md text-center">{error.evicted}</p>
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
                  error?.evictedExplanation ? "border-red-500" : ""
                }`}
                value={answers.evictedExplanation || ''}
                onChange={(e) => handleChange('evictedExplanation', e.target.value)}
                placeholder=""
              />
              {error?.evictedExplanation && (
                <p className="mt-1 text-red-500 text-sm">{error.evictedExplanation}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useApplicationStore } from '@/stores/application-store';

const Questionnaire: React.FC = () => {
  const { answers, setAnswers, errors } = useApplicationStore();
  const error = errors.questionnaire;

  const handleChange = (question: string, value: string | boolean) => {
    setAnswers({
      ...answers,
      [question]: value
    });
  };

  return (
    <div className="w-full">
      <div>
        <div className="mb-6">
          <div className="flex mb-2">
            <div className="w-4/5 flex items-center">
              <span className="font-bold text-[54px] mr-6">1.</span>
              <span className="font-medium text-[26px]">
                Have you been convicted of a felony or misdemeanor offense in the past 7 years?
              </span>
            </div>
            <div className="flex flex-col">
              <RadioGroup
                onValueChange={(value) => handleChange('felony', value === 'true')}
                value={answers.felony?.toString()}
                className="flex justify-center space-x-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="felony-yes" />
                  <Label className='text-[26px] cursor-pointer font-normal' htmlFor="felony-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="felony-no" />
                  <Label className='text-[26px] cursor-pointer font-normal' htmlFor="felony-no">No</Label>
                </div>
              </RadioGroup>
              {error?.felony && (
                <p className="mt-1 text-red-500 text-sm text-center">{error.felony}</p>
              )}
            </div>
          </div>
          <div className="mt-2">
            <Label htmlFor="felonyExplanation" className="text-[24px] font-medium">
              Please provide the date, and nature of the conviction.
            </Label>
            <Textarea
              id="felonyExplanation"
              className={`mt-1 ${error?.felonyExplanation ? "border-red-500" : ""}`}
              value={answers.felonyExplanation || ''}
              onChange={(e) => handleChange('felonyExplanation', e.target.value)}
              placeholder=""
              disabled={!answers.felony}
            />
            {error?.felonyExplanation && (
              <p className="mt-1 text-red-500 text-sm">{error.felonyExplanation}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex mb-2">
            <div className="w-4/5 flex items-center">
              <span className="font-bold text-[54px] mr-6">2.</span>
              <span className="font-medium text-[26px]">
                Have you been evicted from a rental property in the past 7 years?
              </span>
            </div>
            <div className="flex flex-col">
              <RadioGroup
                onValueChange={(value) => handleChange('evicted', value === 'true')}
                value={answers.evicted?.toString()}
                className="flex justify-center space-x-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="evicted-yes" />
                  <Label className='text-[26px] cursor-pointer font-normal' htmlFor="evicted-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="evicted-no" />
                  <Label className='text-[26px] cursor-pointer font-normal' htmlFor="evicted-no">No</Label>
                </div>
              </RadioGroup>
              {error?.evicted && (
                <p className="mt-1 text-red-500 text-sm text-center">{error.evicted}</p>
              )}
            </div>
          </div>
          <div className="mt-2">
            <Label htmlFor="evictedExplanation" className="text-[24px] font-medium">
              Please explain the circumstances surrounding the eviction, including the reason for the eviction, and the outcome.
            </Label>
            <Textarea
              id="evictedExplanation"
              className={`mt-1 ${error?.evictedExplanation ? "border-red-500" : ""}`}
              value={answers.evictedExplanation || ''}
              onChange={(e) => handleChange('evictedExplanation', e.target.value)}
              placeholder=""
              disabled={!answers.evicted}
            />
            {error?.evictedExplanation && (
              <p className="mt-1 text-red-500 text-sm">{error.evictedExplanation}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
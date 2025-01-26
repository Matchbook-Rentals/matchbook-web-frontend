import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface QuestionnaireAnswers {
  felony?: boolean;
  felonyExplanation?: string;
  evicted?: boolean;
  evictedExplanation?: string;
}

interface QuestionnaireProps {
  answers: QuestionnaireAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<QuestionnaireAnswers>>;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ answers, setAnswers }) => {
  const handleChange = (question, value) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
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
          </div>
          <div className="mt-2">
            <Label htmlFor="felonyExplanation" className="text-[24px] font-medium">
              Please provide the date, and nature of the conviction.
            </Label>
            <Textarea
              id="felonyExplanation"
              className="mt-1"
              value={answers.felonyExplanation || ''}
              onChange={(e) => handleChange('felonyExplanation', e.target.value)}
              placeholder=""
            />
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
          </div>
          <div className="mt-2">
            <Label htmlFor="evictedExplanation" className="text-[24px] font-medium">
              Please explain the circumstances surrounding the eviction, including the reason for the eviction, and the outcome.
            </Label>
            <Textarea
              id="evictedExplanation"
              className="mt-1"
              value={answers.evictedExplanation || ''}
              onChange={(e) => handleChange('evictedExplanation', e.target.value)}
              placeholder=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
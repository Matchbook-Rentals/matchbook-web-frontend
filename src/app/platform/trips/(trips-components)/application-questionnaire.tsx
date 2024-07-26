import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface QuestionnaireAnswers {
  evicted?: boolean;
  brokenLease?: boolean;
  landlordDispute?: boolean;
  explanation?: string;
}

interface QuestionnaireProps {
  answers: QuestionnaireAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<QuestionnaireAnswers>>;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ answers, setAnswers }) => {
  const handleChange = (question, value) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const RadioQuestion = ({ question, label }) => (
    <div className="mb-4">
      <Label className="text-base block text-center mb-2">{label}</Label>
      <RadioGroup
        onValueChange={(value) => handleChange(question, value === 'true')}
        value={answers[question]?.toString()}
        className="flex justify-center space-x-8 mt-2"
      >
        <div className="flex flex-col items-center space-y-1">
          <RadioGroupItem value="true" id={`${question}-yes`} />
          <Label htmlFor={`${question}-yes`}>Yes</Label>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <RadioGroupItem value="false" id={`${question}-no`} />
          <Label htmlFor={`${question}-no`}>No</Label>
        </div>
      </RadioGroup>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Questionnaire</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioQuestion
          question="evicted"
          label="Have you ever been evicted?"
        />
        <RadioQuestion
          question="brokenLease"
          label="Have you ever broken a lease?"
        />
        <RadioQuestion
          question="landlordDispute"
          label="Have you ever been involved in a dispute with a landlord?"
        />
        <div className="mt-6">
          <Label htmlFor="explanation" className="text-base">
            Please explain any Yes answers above
          </Label>
          <Textarea
            id="explanation"
            className="mt-2"
            value={answers.explanation || ''}
            onChange={(e) => handleChange('explanation', e.target.value)}
            placeholder="Explanation"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Questionnaire;
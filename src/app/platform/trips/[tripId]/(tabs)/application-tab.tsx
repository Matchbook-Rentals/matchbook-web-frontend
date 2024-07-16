import React from 'react';
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, ApplicationFormData } from '@/lib/zod-schemas'
import { PersonalInfo } from '../../(trips-components)/application-personal-info';
import { Identification } from '../../(trips-components)/application-identity';
import { ResidentialHistory } from '../../(trips-components)/application-resident-history';
import { LandlordInfo } from '../../(trips-components)/application-landlord-info';
import { Income } from '../../(trips-components)/application-income';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Import other components

const ApplicationForm: React.FC = () => {
  const methods = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit: SubmitHandler<ApplicationFormData> = (data) => {
    console.log(data);
    // Handle form submission
  };

return (
    <FormProvider {...methods}>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <PersonalInfo />
            <Identification />
            <ResidentialHistory />
            <LandlordInfo />
            <Income />
            <Button type="submit" className="w-full">Submit Application</Button>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default ApplicationForm;

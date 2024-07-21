'use client'
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

interface ApplicationFormData {
  personalInfo: PersonalInfo;
  residentialHistory: ResidentialHistory;
  landlord: Landlord;
  identifications: IdentificationItem[];
  incomes: IncomeItem[];
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
}

interface ResidentialHistory {
  currentAddress: Address;
  housingStatus: string;
  monthlyPayment: string;
  durationOfTenancy: string;
}

interface Address {
  street: string;
  apt: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Landlord {
  firstName: string;
  lastName: string;
  emailAddress?: string;
  phoneNumber?: string;
}

interface IdentificationItem {
  idType: string;
  idNumber: string;
  verificationImages: VerificationImage[];
}

interface VerificationImage {
  url: string;
}

interface IncomeItem {
  source: string;
  monthlyAmount: string;
  verificationImages?: VerificationImage[];
}

const ApplicationForm: React.FC = () => {
  const [incomes, setIncomes] = React.useState<IncomeItem[]>([])
  const [ids, setIds] = React.useState<IdentificationItem>({
    idType: '',
    idNumber: '',
    verificationImages: []
  })

  const methods = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit: SubmitHandler<ApplicationFormData> = (data) => {
    alert('Made it')
    console.log(data);
    console.log(incomes);
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
            <Identification setIds={setIds} ids={ids} />
            <ResidentialHistory />
            <LandlordInfo />
            <Income setIncomes={setIncomes} />  
            <Button type="submit" className="w-full">Save Application</Button>
            <button type='submit'> LETS GOOOO </button>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default ApplicationForm; 

'use client'
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PersonalInfo } from '../../(trips-components)/application-personal-info';
import { Identification } from '../../(trips-components)/application-identity';
import { ResidentialHistory } from '../../(trips-components)/application-resident-history';
import { LandlordInfo } from '../../(trips-components)/application-landlord-info';
import { Income } from '../../(trips-components)/application-income';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApplication, getTripApplication } from '@/app/actions/applications';
import Questionnaire from '../../(trips-components)/application-questionnaire';
import { useToast } from "@/components/ui/use-toast";

interface ApplicationFormData {
  personalInfo: PersonalInfo;
  residentialHistory: ResidentialHistory;
  landlord: Landlord;
  identifications: IdentificationItem[];
  incomes: IncomeItem[];
  answers: QuestionnaireAnswers;
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
  verificationImages: VerificationImage[]
}
interface VerificationImage {
  url: string;
  category: 'Identification' | 'Income';
}
interface IncomeItem {
  source: string;
  monthlyAmount: string;
  verificationImages: VerificationImage[]
}
interface QuestionnaireAnswers {
  evicted: boolean | null;
  brokenLease: boolean | null;
  landlordDispute: boolean | null;
  explanation: string;
}

const ApplicationForm: React.FC = () => {
  const [personalInfo, setPersonalInfo] = React.useState<PersonalInfo>({ firstName: '', lastName: '' })
  const [ids, setIds] = React.useState<IdentificationItem>({ idType: '', idNumber: '', verificationImages: [] })
  const [residentialHistory, setResidentialHistory] = React.useState({
    currentStreet: '',
    currentApt: '',
    currentCity: '',
    currentState: '',
    currentZipCode: '',
    housingStatus: 'rent',
    monthlyPayment: '',
    durationOfTenancy: '',
  })
  const [landlordInfo, setLandlordInfo] = React.useState<Landlord>({})
  const [incomes, setIncomes] = React.useState<IncomeItem[]>([])
  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>({
    evicted: null,
    brokenLease: null,
    landlordDispute: null,
    explanation: ''
  });
  const params = useParams()
  const { toast } = useToast();

  useEffect(() => {
    const fetchTripApplication = async () => {
      try {
        const response = await getTripApplication(params.tripId as string);
        if (response.success) {
          setPersonalInfo({
            firstName: response?.application?.firstName || '',
            lastName: response?.application?.lastName || ''
          });
        }
      } catch (error) {
        console.error('Error fetching trip application:', error);
      }
    };

    fetchTripApplication();
  }, [params.tripId]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let application = {
      ...personalInfo,
      ...residentialHistory,
      ...answers,
      identifications: [{ idType: ids.idType, idNumber: ids.idNumber }],
      verificationImages: [...ids.verificationImages, ...incomes[0].verificationImages]
    }
    if (residentialHistory.housingStatus === 'rent') {
      application = { ...application, ...landlordInfo }
    }
    console.log('application', application)
    try {
      let result = await createApplication(application)
      console.log('applicationId', result.applicationId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Application updated successfully",
        });
      }
    } catch (error) {
      console.error('Error creating application', error)
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Application Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => onSubmit(e)} className="space-y-6">
          <PersonalInfo personalInfo={personalInfo} setPersonalInfo={setPersonalInfo} />
          <Identification setIds={setIds} ids={ids} />
          <ResidentialHistory residentialHistory={residentialHistory} setResidentialHistory={setResidentialHistory} />
          <LandlordInfo landlordInfo={landlordInfo} setLandlordInfo={setLandlordInfo} isRenter={residentialHistory.housingStatus === 'rent'} />
          <Income setIncomes={setIncomes} />
          <Questionnaire answers={answers} setAnswers={setAnswers} />
          <Button type="submit" className="w-full">Save Application</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ApplicationForm; 
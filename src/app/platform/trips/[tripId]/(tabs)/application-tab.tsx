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
import { useTripContext } from '@/contexts/trip-context-provider';

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
  landlordFirstName: string;
  landlordLastName: string;
  landlordEmail?: string;
  landlordPhoneNumber?: string;
}
interface IdentificationItem {
  idType: string;
  idNumber: string;
  id?: string;
}
interface VerificationImage {
  url: string;
  category: 'Identification' | 'Income';
  id?: string;
}
interface IncomeItem {
  source: string;
  monthlyAmount: string;
  id?: string;
}
interface QuestionnaireAnswers {
  evicted: boolean | null;
  brokenLease: boolean | null;
  landlordDispute: boolean | null;
  explanation: string;
}

const ApplicationForm: React.FC = () => {
  const [personalInfo, setPersonalInfo] = React.useState<PersonalInfo>({ firstName: '', lastName: '' })
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
  const [verificationImages, setVerificationImages] = React.useState<VerificationImage[]>([]);
  const { hasApplication, application } = useTripContext();
  const [ids, setIds] = React.useState<IdentificationItem>(application?.identifications[0] || { idType: '', idNumber: '' })
  const params = useParams()
  const { toast } = useToast();

  useEffect(() => {
    const fetchTripApplication = async () => {
      try {
        if (hasApplication && application) {
          const app = application;

          if (app.identifications && app.identifications[0]) {
            setIds(app.identifications[0]);
          }

          if (app.verificationImages) {
            setVerificationImages(app.verificationImages);

            if (app.firstName || app.lastName) {
              setPersonalInfo({
                firstName: app.firstName || '',
                lastName: app.lastName || ''
              });
            }

            if (app.currentStreet || app.currentApt || app.currentCity || app.currentState || app.currentZipCode ||
              app.housingStatus || app.monthlyPayment || app.durationOfTenancy) {
              setResidentialHistory({
                currentStreet: app.currentStreet || '',
                currentApt: app.currentApt || '',
                currentCity: app.currentCity || '',
                currentState: app.currentState || '',
                currentZipCode: app.currentZipCode || '',
                housingStatus: app.housingStatus || 'rent',
                monthlyPayment: app.monthlyPayment || '',
                durationOfTenancy: app.durationOfTenancy || '',
              });
            }

            if (app.landlordFirstName || app.landlordLastName || app.landlordEmail || app.landlordPhoneNumber) {
              setLandlordInfo({
                landlordFirstName: app.landlordFirstName || '',
                landlordLastName: app.landlordLastName || '',
                landlordEmail: app.landlordEmail || '',
                landlordPhoneNumber: app.landlordPhoneNumber || '',
              });
            }

            if (app.incomes) {
              setIncomes(app.incomes);
            }

            if (app.evicted !== undefined || app.brokenLease !== undefined || app.landlordDispute !== undefined || app.explanation) {
              setAnswers({
                evicted: app.evicted ?? null,
                brokenLease: app.brokenLease ?? null,
                landlordDispute: app.landlordDispute ?? null,
                explanation: app.explanation || '',
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching trip application:', error);
      }
    };

    fetchTripApplication();
  }, [params.tripId, hasApplication, application]); // Added missing comma here

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let application = {
      ...personalInfo,
      ...residentialHistory,
      ...answers,
      incomes: incomes.map(income => ({ source: income.source, monthlyAmount: income.monthlyAmount, id: income.id })),
      identifications: [{ idType: ids.idType, idNumber: ids.idNumber, id: ids.id }],
      verificationImages: verificationImages.map(img => ({ url: img.url, category: img.category, id: img.id }))
    }
    if (residentialHistory.housingStatus === 'rent') {
      application = { ...application, ...landlordInfo }
    }
    console.log('application', application)
    try {
      let result = await createApplication(application)
      console.log('applicationId', result.application)
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
          <Identification
            setIds={setIds}
            ids={ids}
            verificationImages={verificationImages.filter(img => img.category === 'Identification')}
            setVerificationImages={setVerificationImages}
          />
          <Card onClick={() => console.log(application)}>LOG APPLICATION</Card>
          <Card onClick={() => console.log(ids)}>IDS</Card>
          <ResidentialHistory residentialHistory={residentialHistory} setResidentialHistory={setResidentialHistory} />
          <LandlordInfo landlordInfo={landlordInfo} setLandlordInfo={setLandlordInfo} isRenter={residentialHistory.housingStatus === 'rent'} />
          <Income
            setIncomes={setIncomes}
            incomes={incomes}
            verificationImages={verificationImages.filter(img => img.category === 'Income')}
            setVerificationImages={setVerificationImages}
          />
          <Questionnaire answers={answers} setAnswers={setAnswers} />
          <Button type="submit" className="w-full">Save Application</Button>
        </form>
      </CardContent>
    </Card>

  );
};

export default ApplicationForm; 
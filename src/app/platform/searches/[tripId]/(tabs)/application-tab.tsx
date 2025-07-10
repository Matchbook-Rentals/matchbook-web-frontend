'use client'
//Imports
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
import { addParticipant } from '@/app/actions/trips';
import Questionnaire from '../../(trips-components)/application-questionnaire';
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
//import { useSearchContext } from '@/contexts/search-context-provider';
import { useTripContext } from '@/contexts/trip-context-provider';
import { SearchScreenPrompt } from '@/app/platform/old-search/(components)/search-screen-prompt';

//Interfaces
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
  // const { hasApplication, trip, setHasApplication, application } = useTripContext();
  const { state, actions } = useTripContext();
  const { hasApplication, trip, application } = state;
  const { setHasApplication } = actions;

  const [personalInfo, setPersonalInfo] = React.useState<PersonalInfo>({
    firstName: application?.firstName || '',
    lastName: application?.lastName || ''
  });
  const [residentialHistory, setResidentialHistory] = React.useState({
    currentStreet: application?.currentStreet || '',
    currentApt: application?.currentApt || '',
    currentCity: application?.currentCity || '',
    currentState: application?.currentState || '',
    currentZipCode: application?.currentZipCode || '',
    housingStatus: application?.housingStatus || 'rent',
    monthlyPayment: application?.monthlyPayment || '',
    durationOfTenancy: application?.durationOfTenancy || '',
  });
  const [landlordInfo, setLandlordInfo] = React.useState<Landlord>({
    landlordFirstName: application?.landlordFirstName || '',
    landlordLastName: application?.landlordLastName || '',
    landlordEmail: application?.landlordEmail || '',
    landlordPhoneNumber: application?.landlordPhoneNumber || '',
  });
  const [incomes, setIncomes] = React.useState<IncomeItem[]>(application?.incomes || [{ source: '', monthlyAmount: '' }]);
  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>({
    evicted: application?.evicted ?? null,
    brokenLease: application?.brokenLease ?? null,
    landlordDispute: application?.landlordDispute ?? null,
    explanation: application?.explanation || ''
  });
  const [verificationImages, setVerificationImages] = React.useState<VerificationImage[]>(application?.verificationImages || []);
  const [ids, setIds] = React.useState<IdentificationItem>(application?.identifications?.[0] || { idType: '', idNumber: '' });
  const [email, setEmail] = React.useState('')

  const params = useParams();
  const { toast } = useToast();

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
        setHasApplication(true);
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Adding user with email:', email)
    let participant = await addParticipant(trip?.id, email)
    console.log('participant', participant)
    setEmail('')
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Application Form</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className='text-lg border-2'>Add Guest</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <form onSubmit={handleAddUser} className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit">Add User</Button>
            </form>
            <div className="mt-4">
              <h4 className="mb-2 font-medium">Current Participants:</h4>
              <ScrollArea className="h-[100px]" onClick={() => {
                console.log('trip', trip)
              }}>
                <ul className="space-y-1">
                  {trip?.allParticipants?.length > 0 && trip?.allParticipants?.map((participant, index) => (
                    <li key={index}>{participant.firstName} {participant.lastName}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
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
          <ResidentialHistory residentialHistory={residentialHistory} setResidentialHistory={setResidentialHistory} />
          <LandlordInfo landlordInfo={landlordInfo} setLandlordInfo={setLandlordInfo} isRenter={residentialHistory.housingStatus === 'rent'} />
          <Income
            setIncomes={setIncomes}
            incomes={incomes}
            verificationImages={verificationImages.filter(img => img.category === 'Income')}
            setVerificationImages={setVerificationImages}
          />
          <div className="flex justify-center">
            <SearchScreenPrompt isScreened={true} />
          </div>
          <div className="flex justify-center">
            <SearchScreenPrompt isScreened={false} />
          </div>
          <Questionnaire answers={answers} setAnswers={setAnswers} />
          <Button type="submit" className="w-full">Save Application</Button>
        </form>
      </CardContent>
    </Card>

  );
};

export default ApplicationForm; 

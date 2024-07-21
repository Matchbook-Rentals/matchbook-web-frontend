'use client'
import React from 'react';
import { PersonalInfo } from '../../(trips-components)/application-personal-info';
import { Identification } from '../../(trips-components)/application-identity';
import { ResidentialHistory } from '../../(trips-components)/application-resident-history';
import { LandlordInfo } from '../../(trips-components)/application-landlord-info';
import { Income } from '../../(trips-components)/application-income';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApplication } from '@/app/actions/applications';

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

const ApplicationForm: React.FC = () => {

  const [personalInfo, setPersonalInfo] = React.useState<PersonalInfo>({ firstName: '', lastName: '' })
  const [ids, setIds] = React.useState<IdentificationItem>({ idType: '', idNumber: '', verificationImages: [] })
  //
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

  const onSubmit = async () => {
    alert('you made it')
    let application = {
      ...personalInfo,
      ...residentialHistory,
      identifications: [{ idType: ids.idType, idNumber: ids.idNumber }],
      verificationImages: [...ids.verificationImages, ...incomes[0].verificationImages]
    }
    if (residentialHistory.housingStatus === 'rent') {
      application = {...application, ...landlordInfo}
    }
    console.log('application', application)
  };

  return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form  onSubmit={() => alert('you did it')} className="space-y-6">
            <PersonalInfo personalInfo={personalInfo} setPersonalInfo={setPersonalInfo} />
            <Identification setIds={setIds} ids={ids} />
            <ResidentialHistory residentialHistory={residentialHistory} setResidentialHistory={setResidentialHistory} />
            <LandlordInfo landlordInfo={landlordInfo} setLandlordInfo={setLandlordInfo} isRenter={residentialHistory.housingStatus === 'rent'} />
            <Income setIncomes={setIncomes} />
            <Button type="submit"  className="w-full">Save Application</Button>
            <button> LETS GOOOO </button>
          </form>
        </CardContent>
      </Card>
  );
};

export default ApplicationForm; 

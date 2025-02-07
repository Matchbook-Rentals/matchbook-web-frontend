type PersonalInfoErrors = {
  firstName?: string;
  lastName?: string;
};

type IdentificationErrors = {
  idType?: string;
  idNumber?: string;
};

export const validatePersonalInfo = (personalInfo: { firstName: string; lastName: string }) => {
  let errorObj: PersonalInfoErrors = {};
  if (!personalInfo.firstName.trim()) {
    errorObj.firstName = 'First name is required.';
  }
  if (!personalInfo.lastName.trim()) {
    errorObj.lastName = 'Last name is required.';
  }
  return errorObj;
};

export const validateIdentification = (ids: { idType: string; idNumber: string }[]) => {
  let errorObj: IdentificationErrors = {};

  if (!ids || ids.length === 0) {
    errorObj.idType = 'Identification information is required';
    return errorObj;
  }

  const id = ids[0];
  if (!id.idType.trim()) {
    errorObj.idType = 'Identification type is required';
  }
  if (!id.idNumber.trim()) {
    errorObj.idNumber = 'Identification number is required';
  }

  return errorObj;
};

export const validateResidentialHistory = (residentialHistory: {
  currentStreet: string;
  currentCity: string;
  currentState: string;
  currentZipCode: string;
  monthlyPayment: string;
  durationOfTenancy: string;
}) => {
  let errorMsg = '';
  if (!residentialHistory.currentStreet.trim()) {
    errorMsg += 'Street address is required. ';
  }
  if (!residentialHistory.currentCity.trim()) {
    errorMsg += 'City is required. ';
  }
  if (!residentialHistory.currentState.trim()) {
    errorMsg += 'State is required. ';
  }
  if (!residentialHistory.currentZipCode.trim()) {
    errorMsg += 'ZIP Code is required. ';
  }
  if (!residentialHistory.monthlyPayment.trim()) {
    errorMsg += 'Monthly payment is required. ';
  }
  if (!residentialHistory.durationOfTenancy.trim()) {
    errorMsg += 'Duration of tenancy is required. ';
  }
  return errorMsg;
};

export const validateLandlordInfo = (landlordInfo: {
  landlordFirstName: string;
  landlordLastName: string;
  landlordEmail: string;
  landlordPhoneNumber: string;
}) => {
  let errorMsg = '';
  if (!landlordInfo.landlordFirstName.trim()) {
    errorMsg += 'Landlord first name is required. ';
  }
  if (!landlordInfo.landlordLastName.trim()) {
    errorMsg += 'Landlord last name is required. ';
  }
  if (!landlordInfo.landlordEmail.trim()) {
    errorMsg += 'Landlord email is required. ';
  }
  if (!landlordInfo.landlordPhoneNumber.trim()) {
    errorMsg += 'Landlord phone number is required. ';
  }
  return errorMsg;
};

export const validateIncome = (incomes: { source: string; monthlyAmount: string }[]) => {
  let errorMsg = '';
  if (!incomes || incomes.length === 0) {
    errorMsg += 'At least one income entry is required. ';
  } else {
    const inc = incomes[0];
    if (!inc.source.trim()) {
      errorMsg += 'Income source is required. ';
    }
    if (!inc.monthlyAmount.trim()) {
      errorMsg += 'Monthly amount is required. ';
    }
  }
  return errorMsg;
};

export const validateQuestionnaire = (answers: {
  evicted: boolean;
  brokenLease: boolean;
  landlordDispute: boolean;
  explanation: string;
}) => {
  let errorMsg = '';
  if ((answers.evicted || answers.brokenLease || answers.landlordDispute) && !answers.explanation.trim()) {
    errorMsg += 'Explanation is required for questionnaire responses. ';
  }
  return errorMsg;
};
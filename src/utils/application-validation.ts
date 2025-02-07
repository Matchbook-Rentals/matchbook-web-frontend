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

export const validateResidentialHistory = (residentialHistory: any) => {
  const errors: { [key: string]: string } = {};

  if (!residentialHistory.currentStreet) {
    errors.currentStreet = 'Street address is required';
  }

  if (!residentialHistory.currentCity) {
    errors.currentCity = 'City is required';
  }

  if (!residentialHistory.currentState) {
    errors.currentState = 'State is required';
  }

  if (!residentialHistory.currentZipCode) {
    errors.currentZipCode = 'ZIP code is required';
  } else if (!/^\d{5}(-\d{4})?$/.test(residentialHistory.currentZipCode)) {
    errors.currentZipCode = 'Invalid ZIP code format';
  }

  if (!residentialHistory.monthlyPayment) {
    errors.monthlyPayment = 'Monthly payment is required';
  }

  if (!residentialHistory.durationOfTenancy) {
    errors.durationOfTenancy = 'Length of stay is required';
  }

  return errors;
};

export const validateLandlordInfo = (landlordInfo: any) => {
  const errors: { [key: string]: string } = {};

  if (!landlordInfo.landlordFirstName) {
    errors.landlordFirstName = 'First name is required';
  }

  if (!landlordInfo.landlordLastName) {
    errors.landlordLastName = 'Last name is required';
  }

  if (!landlordInfo.landlordEmail) {
    errors.landlordEmail = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(landlordInfo.landlordEmail)) {
    errors.landlordEmail = 'Invalid email format';
  }

  if (!landlordInfo.landlordPhoneNumber) {
    errors.landlordPhoneNumber = 'Phone number is required';
  } else if (!/^\d{10}$/.test(landlordInfo.landlordPhoneNumber.replace(/\D/g, ''))) {
    errors.landlordPhoneNumber = 'Invalid phone number format';
  }

  return errors;
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
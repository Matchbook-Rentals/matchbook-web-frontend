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
  const errors: {
    source?: string[];
    monthlyAmount?: string[];
  } = {
    source: [],
    monthlyAmount: []
  };

  if (!incomes || incomes.length === 0) {
    errors.source = ['At least one income entry is required'];
    errors.monthlyAmount = ['At least one income entry is required'];
    return errors;
  }

  incomes.forEach((income, index) => {
    if (!income.source.trim()) {
      if (!errors.source) errors.source = [];
      errors.source[index] = 'Income source is required';
    }

    // Only validate monthly amount if there's a source
    if (income.source.trim() && !income.monthlyAmount.trim()) {
      if (!errors.monthlyAmount) errors.monthlyAmount = [];
      errors.monthlyAmount[index] = 'Monthly amount is required';
    }
  });

  // Remove the arrays if there are no errors
  if (errors.source?.every(err => !err)) delete errors.source;
  if (errors.monthlyAmount?.every(err => !err)) delete errors.monthlyAmount;

  return errors;
};

export const validateQuestionnaire = (answers: {
  felony: boolean | null;
  felonyExplanation: string;
  evicted: boolean | null;
  evictedExplanation: string;
}) => {
  const errors: {
    felonyExplanation?: string;
    evictedExplanation?: string;
    felony?: string;
    evicted?: string;
  } = {};

  // Validate felony question
  if (answers.felony === null || answers.felony === undefined) {
    errors.felony = 'Please select either Yes or No';
  } else if (answers.felony && !answers.felonyExplanation?.trim()) {
    errors.felonyExplanation = 'Explanation is required when answering Yes';
  }

  // Validate eviction question
  if (answers.evicted === null || answers.evicted === undefined) {
    errors.evicted = 'Please select either Yes or No';
  } else if (answers.evicted && !answers.evictedExplanation?.trim()) {
    errors.evictedExplanation = 'Explanation is required when answering Yes';
  }

  return errors;
};
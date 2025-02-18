import { ResidentialHistory } from "@prisma/client";

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

export const validateResidentialHistory = (residentialHistory: ResidentialHistory[]) => {
  const errors: {
    street?: string[];
    city?: string[];
    state?: string[];
    zipCode?: string[];
    monthlyPayment?: string[];
    durationOfTenancy?: string[];
    landlordFirstName?: string[];
    landlordLastName?: string[];
    landlordEmail?: string[];
    landlordPhoneNumber?: string[];
    overall?: string;
  } = {};

  if (!residentialHistory || residentialHistory.length === 0) {
    errors.overall = 'At least one residential history entry is required';
    return errors;
  }

  // Determine how many residences are required to meet 24 months
  let cumulativeMonths = 0;
  let requiredCount = 0;
  for (let i = 0; i < residentialHistory.length; i++) {
    const duration = parseInt(residentialHistory[i].durationOfTenancy) || 0;
    if (cumulativeMonths < 24) {
      cumulativeMonths += duration;
      requiredCount++;
    } else {
      break;
    }
  }

  // Validate required fields for each required residence
  for (let i = 0; i < requiredCount; i++) {
    const entry = residentialHistory[i];
    const street = entry.street ? entry.street : '';
    const city = entry.city ? entry.city : '';
    const state = entry.state ? entry.state : '';
    const zipCode = entry.zipCode ? entry.zipCode : '';
    const monthlyPayment = entry.monthlyPayment ? entry.monthlyPayment : '';
    const durationOfTenancy = entry.durationOfTenancy ? entry.durationOfTenancy : '';
    if (!street.trim()) {
      errors.street = errors.street || [];
      errors.street[i] = 'Street address is required';
    }
    if (!city.trim()) {
      errors.city = errors.city || [];
      errors.city[i] = 'City is required';
    }
    if (!state.trim()) {
      errors.state = errors.state || [];
      errors.state[i] = 'State is required';
    }
    if (!zipCode.trim()) {
      errors.zipCode = errors.zipCode || [];
      errors.zipCode[i] = 'ZIP code is required';
    }
    if (!monthlyPayment.trim()) {
      errors.monthlyPayment = errors.monthlyPayment || [];
      errors.monthlyPayment[i] = 'Monthly payment is required';
    }
    if (!durationOfTenancy.trim()) {
      errors.durationOfTenancy = errors.durationOfTenancy || [];
      errors.durationOfTenancy[i] = 'Length of stay is required';
    }
    if (entry.housingStatus === 'rent') {
      const landlordFirstName = entry.landlordFirstName ? entry.landlordFirstName : '';
      const landlordLastName = entry.landlordLastName ? entry.landlordLastName : '';
      const landlordEmail = entry.landlordEmail ? entry.landlordEmail : '';
      const landlordPhoneNumber = entry.landlordPhoneNumber ? entry.landlordPhoneNumber : '';
      if (!landlordFirstName.trim()) {
        errors.landlordFirstName = errors.landlordFirstName || [];
        errors.landlordFirstName[i] = 'Landlord first name is required';
      }
      if (!landlordLastName.trim()) {
        errors.landlordLastName = errors.landlordLastName || [];
        errors.landlordLastName[i] = 'Landlord last name is required';
      }
      if (!landlordEmail.trim()) {
        errors.landlordEmail = errors.landlordEmail || [];
        errors.landlordEmail[i] = 'Landlord email is required';
      }
      if (!landlordPhoneNumber.trim()) {
        errors.landlordPhoneNumber = errors.landlordPhoneNumber || [];
        errors.landlordPhoneNumber[i] = 'Landlord phone number is required';
      }
    }
  }

  if (cumulativeMonths < 24) {
    errors.overall = `Total residential duration is ${cumulativeMonths} months; at least 24 months required.`;
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
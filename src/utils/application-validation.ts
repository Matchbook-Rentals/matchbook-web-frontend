import { ResidentialHistory } from "@prisma/client";

type PersonalInfoErrors = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
};

type IdentificationErrors = {
  idType?: string;
  idNumber?: string;
  isPrimary?: string;
  idPhotos?: string;
  primaryPhoto?: string;
};

export const validatePersonalInfo = (personalInfo: { 
  firstName: string; 
  lastName: string;
  middleName?: string;
  noMiddleName?: boolean;
  dateOfBirth?: Date | string;
}) => {
  let errorObj: PersonalInfoErrors = {};
  
  if (!personalInfo.firstName.trim()) {
    errorObj.firstName = 'First Name is required.';
  }
  
  if (!personalInfo.lastName.trim()) {
    errorObj.lastName = 'Last Name is required.';
  }
  
  // New validations
  if (!personalInfo.noMiddleName && (!personalInfo.middleName || !personalInfo.middleName.trim())) {
    errorObj.middleName = 'Middle name is required unless "No Middle Name" is checked';
  }
  
  if (!personalInfo.dateOfBirth) {
    errorObj.dateOfBirth = 'Date of birth is required';
  }
  
  return errorObj;
};

export const validateIdentification = (ids: { 
  id: string;
  idType: string; 
  idNumber: string;
  isPrimary: boolean;
  idPhotos?: {id?: string; url: string; isPrimary: boolean}[];
}[]) => {
  let errorObj: IdentificationErrors = {};

  if (!ids || ids.length === 0) {
    errorObj.idType = 'Identification information is required';
    return errorObj;
  }

  // Check if at least one ID is marked as primary
  if (!ids.some(id => id.isPrimary)) {
    errorObj.isPrimary = 'At least one identification must be marked as primary';
  }

  const id = ids[0];
  if (!id.idType.trim()) {
    errorObj.idType = 'Identification Type is required';
  }
  if (!id.idNumber.trim()) {
    errorObj.idNumber = 'Identification Number is required';
  }

  // New validations for photos
  if (!id.idPhotos || id.idPhotos.length === 0) {
    errorObj.idPhotos = 'At least one photo is required for identification';
  } else if (!id.idPhotos.some(photo => photo.isPrimary)) {
    errorObj.primaryPhoto = 'One photo must be marked as primary';
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
    const duration = parseInt(residentialHistory[i].durationOfTenancy || '0') || 0;
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
      errors.street[i] = `Residence ${i + 1}: Street Address is required`;
    }
    if (!city.trim()) {
      errors.city = errors.city || [];
      errors.city[i] = `Residence ${i + 1}: City is required`;
    }
    if (!state.trim()) {
      errors.state = errors.state || [];
      errors.state[i] = `Residence ${i + 1}: State is required`;
    }
    if (!zipCode.trim()) {
      errors.zipCode = errors.zipCode || [];
      errors.zipCode[i] = `Residence ${i + 1}: ZIP Code is required`;
    }
    if (!monthlyPayment.trim()) {
      errors.monthlyPayment = errors.monthlyPayment || [];
      errors.monthlyPayment[i] = `Residence ${i + 1}: Monthly Payment is required`;
    }
    if (!durationOfTenancy.trim()) {
      errors.durationOfTenancy = errors.durationOfTenancy || [];
      errors.durationOfTenancy[i] = `Residence ${i + 1}: Length of Stay is required`;
    }
    if (entry.housingStatus === 'rent') {
      const landlordFirstName = entry.landlordFirstName ? entry.landlordFirstName : '';
      const landlordLastName = entry.landlordLastName ? entry.landlordLastName : '';
      const landlordEmail = entry.landlordEmail ? entry.landlordEmail : '';
      const landlordPhoneNumber = entry.landlordPhoneNumber ? entry.landlordPhoneNumber : '';
      if (!landlordFirstName.trim()) {
        errors.landlordFirstName = errors.landlordFirstName || [];
        errors.landlordFirstName[i] = `Residence ${i + 1}: Landlord First Name is required`;
      }
      if (!landlordLastName.trim()) {
        errors.landlordLastName = errors.landlordLastName || [];
        errors.landlordLastName[i] = `Residence ${i + 1}: Landlord Last Name is required`;
      }
      if (!landlordEmail.trim()) {
        errors.landlordEmail = errors.landlordEmail || [];
        errors.landlordEmail[i] = `Residence ${i + 1}: Landlord Email is required`;
      }
      if (!landlordPhoneNumber.trim()) {
        errors.landlordPhoneNumber = errors.landlordPhoneNumber || [];
        errors.landlordPhoneNumber[i] = `Residence ${i + 1}: Landlord Phone Number is required`;
      }
    }
  }

  if (cumulativeMonths < 24) {
    errors.overall = `Total residential duration is ${cumulativeMonths} months; at least 24 months required.`;
  }

  return errors;
};

export const validateIncome = (
  incomes: { source: string; monthlyAmount: string; imageUrl: string }[]
) => {
  const errors: {
    source?: string[];
    monthlyAmount?: string[];
    imageUrl?: string[];
  } = {
    source: [],
    monthlyAmount: [],
    imageUrl: []
  };

  if (!incomes || incomes.length === 0) {
    errors.source = ['At least one income entry is required'];
    errors.monthlyAmount = ['At least one income entry is required'];
    errors.imageUrl = ['At least one income entry is required'];
    return errors;
  }

  incomes.forEach((income, index) => {
    if (!income.source.trim()) {
      errors.source = errors.source || [];
      errors.source[index] = 'Income Source is required';
    }
    if (!income.monthlyAmount.trim()) {
      errors.monthlyAmount = errors.monthlyAmount || [];
      errors.monthlyAmount[index] = 'Monthly Amount is required';
    }
    if (!income.imageUrl.trim()) {
      errors.imageUrl = errors.imageUrl || [];
      errors.imageUrl[index] = 'Income Proof is required';
    }
  });

  if (errors.source?.every(err => !err)) delete errors.source;
  if (errors.monthlyAmount?.every(err => !err)) delete errors.monthlyAmount;
  if (errors.imageUrl?.every(err => !err)) delete errors.imageUrl;

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
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
    const error = 'First Name is required.';
    console.log(`❌ Validation failed: firstName - "${personalInfo.firstName}" - ${error}`);
    errorObj.firstName = error;
  }
  
  if (!personalInfo.lastName.trim()) {
    const error = 'Last Name is required.';
    console.log(`❌ Validation failed: lastName - "${personalInfo.lastName}" - ${error}`);
    errorObj.lastName = error;
  }
  
  // New validations
  if (!personalInfo.noMiddleName && (!personalInfo.middleName || !personalInfo.middleName.trim())) {
    const error = 'Middle name is required unless "No Middle Name" is checked';
    console.log(`❌ Validation failed: middleName - "${personalInfo.middleName}" (noMiddleName: ${personalInfo.noMiddleName}) - ${error}`);
    errorObj.middleName = error;
  }
  
  if (!personalInfo.dateOfBirth) {
    const error = 'Date of birth is required';
    console.log(`❌ Validation failed: dateOfBirth - "${personalInfo.dateOfBirth}" - ${error}`);
    errorObj.dateOfBirth = error;
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
    const error = 'Identification information is required';
    console.log(`❌ Validation failed: identification - "no IDs provided" - ${error}`);
    errorObj.idType = error;
    return errorObj;
  }

  // Check if at least one ID is marked as primary
  if (!ids.some(id => id.isPrimary)) {
    const error = 'At least one identification must be marked as primary';
    console.log(`❌ Validation failed: isPrimary - "no primary ID found" - ${error}`);
    errorObj.isPrimary = error;
  }

  const id = ids[0];
  if (!id.idType.trim()) {
    const error = 'Identification Type is required';
    console.log(`❌ Validation failed: idType - "${id.idType}" - ${error}`);
    errorObj.idType = error;
  }
  if (!id.idNumber.trim()) {
    const error = 'Identification Number is required';
    console.log(`❌ Validation failed: idNumber - "${id.idNumber}" - ${error}`);
    errorObj.idNumber = error;
  }

  // New validations for photos
  if (!id.idPhotos || id.idPhotos.length === 0) {
    const error = 'At least one photo is required for identification';
    console.log(`❌ Validation failed: idPhotos - "no photos provided" - ${error}`);
    errorObj.idPhotos = error;
  } else if (!id.idPhotos.some(photo => photo.isPrimary)) {
    const error = 'One photo must be marked as primary';
    console.log(`❌ Validation failed: primaryPhoto - "no primary photo found" - ${error}`);
    errorObj.primaryPhoto = error;
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
    const error = 'Current residence is required';
    console.log(`❌ Validation failed: residentialHistory - "no entries provided" - ${error}`);
    errors.overall = error;
    return errors;
  }

  // Only validate current residence (first entry) as required
  // Validate additional residences only if they have partial data
  for (let i = 0; i < residentialHistory.length; i++) {
    const entry = residentialHistory[i];
    const street = entry.street ? entry.street : '';
    const city = entry.city ? entry.city : '';
    const state = entry.state ? entry.state : '';
    const zipCode = entry.zipCode ? entry.zipCode : '';
    const durationOfTenancy = entry.durationOfTenancy ? entry.durationOfTenancy : '';

    // For first residence (current), all fields are required
    // For additional residences, only validate if any field is filled
    const isCurrentResidence = i === 0;
    const hasPartialData = street || city || state || zipCode || durationOfTenancy ||
                          entry.landlordFirstName || entry.landlordLastName;

    if (isCurrentResidence || hasPartialData) {
      if (!street.trim()) {
        const error = isCurrentResidence ? 'Current Residence: Street Address is required' : 'Previous Residence: Street Address is required';
        console.log(`❌ Validation failed: street[${i}] - "${street}" - ${error}`);
        errors.street = errors.street || [];
        errors.street[i] = error;
      }
      if (!city.trim()) {
        const error = isCurrentResidence ? 'Current Residence: City is required' : 'Previous Residence: City is required';
        console.log(`❌ Validation failed: city[${i}] - "${city}" - ${error}`);
        errors.city = errors.city || [];
        errors.city[i] = error;
      }
      if (!state.trim()) {
        const error = isCurrentResidence ? 'Current Residence: State is required' : 'Previous Residence: State is required';
        console.log(`❌ Validation failed: state[${i}] - "${state}" - ${error}`);
        errors.state = errors.state || [];
        errors.state[i] = error;
      }
      if (!zipCode.trim()) {
        const error = isCurrentResidence ? 'Current Residence: ZIP Code is required' : 'Previous Residence: ZIP Code is required';
        console.log(`❌ Validation failed: zipCode[${i}] - "${zipCode}" - ${error}`);
        errors.zipCode = errors.zipCode || [];
        errors.zipCode[i] = error;
      }
      if (!durationOfTenancy.trim()) {
        const error = isCurrentResidence ? 'Current Residence: Length of Stay is required' : 'Previous Residence: Length of Stay is required';
        console.log(`❌ Validation failed: durationOfTenancy[${i}] - "${durationOfTenancy}" - ${error}`);
        errors.durationOfTenancy = errors.durationOfTenancy || [];
        errors.durationOfTenancy[i] = error;
      }

      if (entry.housingStatus === 'rent') {
        const landlordFirstName = entry.landlordFirstName ? entry.landlordFirstName : '';
        const landlordLastName = entry.landlordLastName ? entry.landlordLastName : '';
        const landlordEmail = entry.landlordEmail ? entry.landlordEmail : '';
        const landlordPhoneNumber = entry.landlordPhoneNumber ? entry.landlordPhoneNumber : '';

        if (!landlordFirstName.trim()) {
          const error = isCurrentResidence ? 'Current Landlord: First Name is required' : 'Previous Landlord: First Name is required';
          errors.landlordFirstName = errors.landlordFirstName || [];
          errors.landlordFirstName[i] = error;
        }
        if (!landlordLastName.trim()) {
          const error = isCurrentResidence ? 'Current Landlord: Last Name is required' : 'Previous Landlord: Last Name is required';
          errors.landlordLastName = errors.landlordLastName || [];
          errors.landlordLastName[i] = error;
        }
        // Require at least one contact method: email OR phone
        if (!landlordEmail.trim() && !landlordPhoneNumber.trim()) {
          const error = isCurrentResidence ? 'Current Landlord: Email or Phone Number is required' : 'Previous Landlord: Email or Phone Number is required';
          errors.landlordEmail = errors.landlordEmail || [];
          errors.landlordEmail[i] = error;
          errors.landlordPhoneNumber = errors.landlordPhoneNumber || [];
          errors.landlordPhoneNumber[i] = error;
        }
      }
    }
  }

  return errors;
};

export const validateIncome = (
  incomes: { source: string; monthlyAmount: string; imageUrl?: string; fileKey?: string }[]
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
    const error = 'At least one income entry is required';
    console.log(`❌ Validation failed: incomes - "no entries provided" - ${error}`);
    errors.source = [error];
    errors.monthlyAmount = [error];
    errors.imageUrl = [error];
    return errors;
  }

  incomes.forEach((income, index) => {
    if (!income.source.trim()) {
      const error = 'Income Source is required';
      console.log(`❌ Validation failed: income[${index}].source - "${income.source}" - ${error}`);
      errors.source = errors.source || [];
      errors.source[index] = error;
    }
    if (!income.monthlyAmount.trim()) {
      const error = 'Monthly Amount is required';
      console.log(`❌ Validation failed: income[${index}].monthlyAmount - "${income.monthlyAmount}" - ${error}`);
      errors.monthlyAmount = errors.monthlyAmount || [];
      errors.monthlyAmount[index] = error;
    }
    // Check for either imageUrl (backward compatibility) or fileKey (new secure uploads)
    if (!income.fileKey && (!income.imageUrl || !income.imageUrl.trim())) {
      const error = 'Income Proof is required';
      console.log(`❌ Validation failed: income[${index}].imageUrl/fileKey - "fileKey: ${income.fileKey}, imageUrl: ${income.imageUrl}" - ${error}`);
      errors.imageUrl = errors.imageUrl || [];
      errors.imageUrl[index] = error;
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
    const error = 'Please select either Yes or No';
    console.log(`❌ Validation failed: felony - "${answers.felony}" - ${error}`);
    errors.felony = error;
  } else if (answers.felony && !answers.felonyExplanation?.trim()) {
    const error = 'Explanation is required when answering Yes';
    console.log(`❌ Validation failed: felonyExplanation - "${answers.felonyExplanation}" (felony: ${answers.felony}) - ${error}`);
    errors.felonyExplanation = error;
  }

  // Validate eviction question
  if (answers.evicted === null || answers.evicted === undefined) {
    const error = 'Please select either Yes or No';
    console.log(`❌ Validation failed: evicted - "${answers.evicted}" - ${error}`);
    errors.evicted = error;
  } else if (answers.evicted && !answers.evictedExplanation?.trim()) {
    const error = 'Explanation is required when answering Yes';
    console.log(`❌ Validation failed: evictedExplanation - "${answers.evictedExplanation}" (evicted: ${answers.evicted}) - ${error}`);
    errors.evictedExplanation = error;
  }

  return errors;
};
/**
 * Application Completion Requirements
 * 
 * An application is considered complete when ALL of the following are met:
 * 
 * 1. PERSONAL INFORMATION
 *    - First name (required)
 *    - Last name (required)
 *    - Middle name (required unless "No Middle Name" is checked)
 *    - Date of birth (required)
 * 
 * 2. IDENTIFICATION
 *    - At least one ID with:
 *      - ID type (required)
 *      - ID number (required)
 *      - At least one ID photo (required)
 * 
 * 3. INCOME
 *    - At least one income source with:
 *      - Source/employer name (required)
 *      - Monthly amount (required)
 * 
 * 4. QUESTIONNAIRE
 *    - If felony = true: felony explanation required
 *    - If evicted = true: eviction explanation required
 * 
 * 5. RESIDENTIAL HISTORY
 *    - At least one residence (current) with:
 *      - Street address (required)
 *      - City (required)
 *      - State (required)
 *      - ZIP code (required)
 *      - If housingStatus = 'rent':
 *        - Landlord first name (required)
 *        - Landlord last name (required)
 */

export interface CompletionResult {
  isComplete: boolean;
  missingRequirements: string[];
}

// Type definitions for client-side data (from store)
interface ClientIdentification {
  idType: string;
  idNumber: string;
  idPhotos?: Array<{ fileKey?: string; url?: string }>;
}

interface ClientIncome {
  source: string;
  monthlyAmount: string;
}

interface ClientResidentialHistory {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  housingStatus?: string;
  landlordFirstName?: string;
  landlordLastName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
}

interface ClientApplicationData {
  personalInfo: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    noMiddleName?: boolean;
    dateOfBirth?: string;
  };
  ids: ClientIdentification[];
  incomes: ClientIncome[];
  answers: {
    felony?: boolean;
    felonyExplanation?: string;
    evicted?: boolean;
    evictedExplanation?: string;
  };
  residentialHistory: ClientResidentialHistory[];
}

// Type definitions for server-side data (from Prisma)
interface ServerIdentification {
  idType: string | null;
  idNumber: string | null;
  idPhotos?: Array<{ id: string }>;
}

interface ServerIncome {
  source: string | null;
  monthlyAmount: string | null;
}

interface ServerResidentialHistory {
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  housingStatus: string | null;
  landlordFirstName: string | null;
  landlordLastName: string | null;
  landlordPhone: string | null;
  landlordEmail: string | null;
}

interface ServerApplicationData {
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  noMiddleName: boolean | null;
  dateOfBirth: Date | null;
  felony: boolean | null;
  felonyExplanation: string | null;
  evicted: boolean | null;
  evictedExplanation: string | null;
  identifications?: ServerIdentification[];
  incomes?: ServerIncome[];
  residentialHistories?: ServerResidentialHistory[];
}

/**
 * Check application completion for client-side data (used in store)
 */
export function checkApplicationCompletionClient(data: ClientApplicationData): CompletionResult {
  const missingRequirements: string[] = [];

  // 1. Check Personal Info
  if (!data.personalInfo.firstName?.trim()) {
    missingRequirements.push('First name');
  }
  if (!data.personalInfo.lastName?.trim()) {
    missingRequirements.push('Last name');
  }
  if (!data.personalInfo.noMiddleName && !data.personalInfo.middleName?.trim()) {
    missingRequirements.push('Middle name');
  }
  if (!data.personalInfo.dateOfBirth) {
    missingRequirements.push('Date of birth');
  }

  // 2. Check Identification
  const hasValidId = data.ids.some(id => 
    id.idType && 
    id.idNumber && 
    id.idPhotos && 
    id.idPhotos.length > 0
  );
  
  if (!hasValidId) {
    if (data.ids.length === 0) {
      missingRequirements.push('Identification');
    } else if (!data.ids.some(id => id.idPhotos && id.idPhotos.length > 0)) {
      missingRequirements.push('ID photo');
    } else if (!data.ids.some(id => id.idType && id.idNumber)) {
      missingRequirements.push('ID information');
    }
  }

  // 3. Check Income
  const hasValidIncome = data.incomes.some(income => 
    income.source?.trim() && 
    income.monthlyAmount?.trim()
  );
  
  if (!hasValidIncome) {
    missingRequirements.push('Income information');
  }

  // 4. Check Questionnaire
  if (data.answers.felony && !data.answers.felonyExplanation?.trim()) {
    missingRequirements.push('Felony explanation');
  }
  if (data.answers.evicted && !data.answers.evictedExplanation?.trim()) {
    missingRequirements.push('Eviction explanation');
  }

  // 5. Check Residential History
  const firstResidence = data.residentialHistory?.[0];
  if (!firstResidence) {
    missingRequirements.push('Current address');
  } else {
    // Check basic address fields
    if (!firstResidence.street?.trim()) {
      missingRequirements.push('Street address');
    }
    if (!firstResidence.city?.trim()) {
      missingRequirements.push('City');
    }
    if (!firstResidence.state?.trim()) {
      missingRequirements.push('State');
    }
    if (!firstResidence.zipCode?.trim()) {
      missingRequirements.push('ZIP code');
    }

    // Check landlord info if renting
    if (firstResidence.housingStatus === 'rent') {
      if (!firstResidence.landlordFirstName?.trim()) {
        missingRequirements.push('Landlord first name');
      }
      if (!firstResidence.landlordLastName?.trim()) {
        missingRequirements.push('Landlord last name');
      }
    }
  }

  return {
    isComplete: missingRequirements.length === 0,
    missingRequirements
  };
}

/**
 * Check application completion for server-side data (used in server actions)
 */
export function checkApplicationCompletionServer(application: ServerApplicationData): CompletionResult {
  const missingRequirements: string[] = [];

  // 1. Check Personal Info
  if (!application.firstName?.trim()) {
    missingRequirements.push('First name');
  }
  if (!application.lastName?.trim()) {
    missingRequirements.push('Last name');
  }
  if (!application.noMiddleName && !application.middleName?.trim()) {
    missingRequirements.push('Middle name');
  }
  if (!application.dateOfBirth) {
    missingRequirements.push('Date of birth');
  }

  // 2. Check Identification
  const hasValidId = application.identifications?.some(id => 
    id.idType && 
    id.idNumber && 
    id.idPhotos && 
    id.idPhotos.length > 0
  ) || false;
  
  if (!hasValidId) {
    if (!application.identifications || application.identifications.length === 0) {
      missingRequirements.push('Identification');
    } else if (!application.identifications.some(id => id.idPhotos && id.idPhotos.length > 0)) {
      missingRequirements.push('ID photo');
    } else if (!application.identifications.some(id => id.idType && id.idNumber)) {
      missingRequirements.push('ID information');
    }
  }

  // 3. Check Income
  const hasValidIncome = application.incomes?.some(income => 
    income.source?.trim() && 
    income.monthlyAmount?.trim()
  ) || false;
  
  if (!hasValidIncome) {
    missingRequirements.push('Income information');
  }

  // 4. Check Questionnaire
  if (application.felony && !application.felonyExplanation?.trim()) {
    missingRequirements.push('Felony explanation');
  }
  if (application.evicted && !application.evictedExplanation?.trim()) {
    missingRequirements.push('Eviction explanation');
  }

  // 5. Check Residential History
  // Sort by index to ensure we're checking the first/current residence
  const sortedResidences = application.residentialHistories?.sort((a: any, b: any) => 
    (a.index || 0) - (b.index || 0)
  );
  const firstResidence = sortedResidences?.[0];
  
  if (!firstResidence) {
    missingRequirements.push('Current address');
  } else {
    // Check basic address fields
    if (!firstResidence.street?.trim()) {
      missingRequirements.push('Street address');
    }
    if (!firstResidence.city?.trim()) {
      missingRequirements.push('City');
    }
    if (!firstResidence.state?.trim()) {
      missingRequirements.push('State');
    }
    if (!firstResidence.zipCode?.trim()) {
      missingRequirements.push('ZIP code');
    }

    // Check landlord info if renting
    if (firstResidence.housingStatus === 'rent') {
      if (!firstResidence.landlordFirstName?.trim()) {
        missingRequirements.push('Landlord first name');
      }
      if (!firstResidence.landlordLastName?.trim()) {
        missingRequirements.push('Landlord last name');
      }
    }
  }

  return {
    isComplete: missingRequirements.length === 0,
    missingRequirements
  };
}
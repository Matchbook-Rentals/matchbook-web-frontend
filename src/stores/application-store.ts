import { create } from 'zustand';
import { VerificationImage } from '@prisma/client';
import { markComplete } from '@/app/actions/applications';
import { ResidentialHistory } from '@prisma/client';

export const defaultResidentialHistory: ResidentialHistory = {
  street: "",
  apt: "",
  city: "",
  state: "",
  zipCode: "",
  monthlyPayment: "",
  durationOfTenancy: "",
  housingStatus: "rent",
  landlordFirstName: "",
  landlordLastName: "",
  landlordEmail: "",
  landlordPhoneNumber: ""
};

// interface ResidentialHistory {
//   id                  String      @id @default(uuid())
//   street              String?
//   apt                 String?
//   city                String?
//   state               String?
//   zipCode             String?
//   monthlyPayment      String?
//   durationOfTenancy   String?
//   housingStatus       String?
//   landlordFirstName   String?
//   landlordLastName    String?
//   landlordEmail       String?
//   landlordPhoneNumber String?

//   application         Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
//   applicationId       String
// }

interface PersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  noMiddleName?: boolean;
  dateOfBirth?: Date | string;
  ssn?: string;
}

interface Identification {
  id: string;
  idType: string;
  idNumber: string;
  isPrimary: boolean;
  idPhotos?: IDPhoto[];
}

interface IDPhoto {
  id?: string;
  url: string;
  isPrimary: boolean;
}


interface Income {
  id?: string;
  source: string;
  monthlyAmount: string;
  imageUrl: string;
}

interface QuestionnaireAnswers {
  evicted: boolean;
  felony: boolean;
  felonyExplanation: string;
  evictedExplanation: string;
}

interface ApplicationErrors {
  basicInfo: {
    personalInfo: { 
      firstName?: string; 
      lastName?: string;
      middleName?: string;
      dateOfBirth?: string;
      ssn?: string;
    };
    identification: { idType?: string; idNumber?: string };
  };
  identification: { 
    idType?: string; 
    idNumber?: string;
    isPrimary?: string;
    idPhotos?: string;
    primaryPhoto?: string;
  };
  residentialHistory: {
    overall?: string;
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
  };
  income: {
    source?: string[];
    monthlyAmount?: string[];
    imageUrl?: string[];
  };
  questionnaire: {
    felony?: string;
    felonyExplanation?: string;
    evicted?: string;
    evictedExplanation?: string;
  };
}

export const initialState = {
  personalInfo: {
    firstName: '',
    lastName: '',
    middleName: '',
    noMiddleName: false,
    dateOfBirth: '',
    ssn: ''
  },
  ids: [{ id: '', idType: '', idNumber: '', isPrimary: true, idPhotos: [] }],
  verificationImages: [] as VerificationImage[],
  residentialHistory: [defaultResidentialHistory],
  incomes: [{ source: '', monthlyAmount: '', imageUrl: '' }],
  answers: {
    evicted: false,
    felony: false,
    felonyExplanation: '',
    evictedExplanation: ''
  }
};

interface ApplicationState {
  personalInfo: PersonalInfo;
  ids: Identification[];
  verificationImages: VerificationImage[];
  residentialHistory: ResidentialHistory[];
  incomes: Income[];
  answers: QuestionnaireAnswers;
  originalData: typeof initialState;

  // Actions
  setPersonalInfo: (info: PersonalInfo) => void;
  setIds: (ids: Identification[]) => void;
  setVerificationImages: (images: VerificationImage[]) => void;
  setResidentialHistory: (history: ResidentialHistory[]) => void;
  setIncomes: (incomes: Income[]) => void;
  setAnswers: (answers: QuestionnaireAnswers) => void;
  resetStore: () => void;
  initializeFromApplication: (application: any) => void;

  // Add new property
  isEdited: () => boolean;

  // Add error state
  errors: ApplicationErrors;

  // Add error actions
  setErrors: (step: keyof ApplicationErrors, errors: ApplicationErrors[typeof step]) => void;
  clearErrors: () => void;

  // <<< NEW ACTION TO UPDATE ORIGINAL DATA AFTER SYNC >>>
  markSynced: () => void;

  // <<< NEW ACTION: checkCompletion for determining if the application is complete >>>
  checkCompletion: (applicationId: string) => { complete: boolean; missingFields: string[] };

  // New action to add a residential history entry if total duration is less than 24
  addResidentialHistoryEntry: (newEntry: ResidentialHistory) => void;
}

const initialErrors: ApplicationErrors = {
  basicInfo: {
    personalInfo: {},
    identification: {},
  },
  identification: {
    idType: '',
    idNumber: '',
    isPrimary: '',
    idPhotos: '',
    primaryPhoto: '',
  },
  residentialHistory: {
    overall: '',
    street: [],
    city: [],
    state: [],
    zipCode: [],
    monthlyPayment: [],
    durationOfTenancy: [],
    landlordFirstName: [],
    landlordLastName: [],
    landlordEmail: [],
    landlordPhoneNumber: [],
  },
  income: {
    source: [],
    monthlyAmount: [],
    imageUrl: [],
  },
  questionnaire: {
    felony: '',
    felonyExplanation: '',
    evicted: '',
    evictedExplanation: '',
  },
};

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  ...initialState,
  originalData: { ...initialState },

  setPersonalInfo: (info) => set({ personalInfo: info }),
  setIds: (ids) => set({ ids }),
  setVerificationImages: (images) => set({ verificationImages: images }),
  setResidentialHistory: (history: ResidentialHistory[]) => set({ residentialHistory: history }),
  // New action to add a residential history entry if total duration is less than 24
  addResidentialHistoryEntry: (newEntry: ResidentialHistory) => {
    const currentHistory = get().residentialHistory;
    const currentSum = currentHistory.reduce((sum, entry) => sum + ((parseInt(entry.durationOfTenancy || '0')) || 0), 0);
    if (currentSum >= 24) {
      console.log('Residential history complete. Total duration:', currentSum);
      return;
    }
    set({ residentialHistory: [...currentHistory, newEntry] });
  },
  setIncomes: (incomes) => set({ incomes }),
  setAnswers: (answers) => set({ answers }),

  resetStore: () => set(initialState),

  initializeFromApplication: (application) => {
    if (!application) return;

    let residences;
    console.log('application.residentialHistories', application.residentialHistories);
    if (application.residentialHistories.length === 0) {
      residences = [defaultResidentialHistory];
    } else {
      residences = application.residentialHistories.sort((a: any, b: any) => a.index - b.index);
    }

    const newData = {
      personalInfo: {
        firstName: application.firstName || '',
        lastName: application.lastName || '',
        middleName: application.middleName || '',
        noMiddleName: application.noMiddleName || false,
        dateOfBirth: application.dateOfBirth || '',
        ssn: application.ssn || ''
      },
      ids: application.identifications?.map((id: any) => ({
        id: id.id || '',
        idType: id.idType || '',
        idNumber: id.idNumber || '',
        isPrimary: id.isPrimary || false,
        idPhotos: id.idPhotos || [] // Map idPhotos from the backend to photos in our store
      })) || [{ id: '', idType: '', idNumber: '', isPrimary: true, idPhotos: [] }],
      verificationImages: application.verificationImages || [] as VerificationImage[],
      residentialHistory: residences,
      incomes: application.incomes?.map((income: any) => ({
        id: income.id || null,
        source: income.source || '',
        monthlyAmount: (income.monthlyAmount || '').toString().replace(/[$,]/g, '').split('.')[0],
        imageUrl: income.imageUrl || ''
      })) || [{ source: '', monthlyAmount: '', imageUrl: '' }],
      answers: {
        evicted: application.evicted || false,
        felony: application.felony || false,
        felonyExplanation: application.felonyExplanation || '',
        evictedExplanation: application.evictedExplanation || ''
      }
    };
    set(newData);
    // Update the pristine/original state for proper comparison
    set({ originalData: newData });
  },

  isEdited: () => {
    const state = get();
    return JSON.stringify({
      personalInfo: state.personalInfo,
      ids: state.ids,
      verificationImages: state.verificationImages,
      residentialHistory: state.residentialHistory,
      incomes: state.incomes,
      answers: state.answers
    }) !== JSON.stringify(state.originalData);
  },

  errors: initialErrors,

  setErrors: (step, errors) => set(state => ({
    errors: {
      ...state.errors,
      [step]: errors
    }
  })),

  clearErrors: () => set({ errors: initialErrors }),

  // <<< NEW ACTION: markSynced >>>
  markSynced: () => {
    const {
      personalInfo,
      ids,
      verificationImages,
      residentialHistory,
      incomes,
      answers,
    } = get();
    const newData = {
      personalInfo,
      ids,
      verificationImages,
      residentialHistory,
      incomes,
      answers,
    };
    console.log('markSynced invoked. New data to sync:', newData);
    set({ originalData: newData });
    console.log('Original data updated to:', newData);
  },

  // <<< NEW ACTION: checkCompletion >>>
  checkCompletion: (applicationId: string) => {
    const state = get();
    const missingFields: string[] = [];

    // Check Personal Info
    if (!state.personalInfo.firstName) missingFields.push('personalInfo.firstName');
    if (!state.personalInfo.lastName) missingFields.push('personalInfo.lastName');
    // New field validations
    if (!state.personalInfo.noMiddleName && !state.personalInfo.middleName) {
      missingFields.push('personalInfo.middleName');
    }
    if (!state.personalInfo.dateOfBirth) missingFields.push('personalInfo.dateOfBirth');
    // Check SSN
    if (!state.personalInfo.ssn || state.personalInfo.ssn.trim() === '') {
      missingFields.push('personalInfo.ssn (required)');
    } else {
      // Remove all non-digits first
      const digitsOnly = state.personalInfo.ssn.replace(/\D/g, '');
      // Check if we have exactly 9 digits
      if (digitsOnly.length !== 9) {
        missingFields.push('personalInfo.ssn (must contain 9 digits)');
      }
    }

    // Check Identification(s)
    if (!state.ids || state.ids.length === 0) {
      missingFields.push('ids (no identification provided)');
    } else {
      // Check if at least one ID is marked as primary
      if (!state.ids.some(id => id.isPrimary)) {
        missingFields.push('ids (no primary identification marked)');
      }

      state.ids.forEach((id, index) => {
        if (!id.idType) missingFields.push(`ids[${index}].idType`);
        if (!id.idNumber) missingFields.push(`ids[${index}].idNumber`);
        
        // Check for ID photos
        if (!id.idPhotos || id.idPhotos.length === 0) {
          missingFields.push(`ids[${index}].idPhotos (no photos provided)`);
        } else if (!id.idPhotos.some(photo => photo.isPrimary)) {
          missingFields.push(`ids[${index}].idPhotos (no primary photo marked)`);
        }
      });
    }

    // Check Residential History total duration
    const totalDuration = state.residentialHistory.reduce((sum, entry) => sum + ((parseInt(entry.durationOfTenancy || '0')) || 0), 0);
    if (totalDuration < 24) {
      missingFields.push('residentialHistory total duration less than 24');
    }
    // New check: ensure each residential history entry has all required fields (except apt) and landlord info if needed
    state.residentialHistory.forEach((entry, index) => {
      if (!entry.street) missingFields.push(`residentialHistory[${index}].street`);
      if (!entry.city) missingFields.push(`residentialHistory[${index}].city`);
      if (!entry.state) missingFields.push(`residentialHistory[${index}].state`);
      if (!entry.zipCode) missingFields.push(`residentialHistory[${index}].zipCode`);
      if (!entry.monthlyPayment) missingFields.push(`residentialHistory[${index}].monthlyPayment`);
      if (!entry.durationOfTenancy) missingFields.push(`residentialHistory[${index}].durationOfTenancy`);
      if (!entry.housingStatus) {
        missingFields.push(`residentialHistory[${index}].housingStatus`);
      } else if (entry.housingStatus !== 'own') {
        if (!entry.landlordFirstName) missingFields.push(`residentialHistory[${index}].landlordFirstName`);
        if (!entry.landlordLastName) missingFields.push(`residentialHistory[${index}].landlordLastName`);
        if (!entry.landlordEmail) missingFields.push(`residentialHistory[${index}].landlordEmail`);
        if (!entry.landlordPhoneNumber) missingFields.push(`residentialHistory[${index}].landlordPhoneNumber`);
      }
    });

    // Check Incomes
    if (!state.incomes || state.incomes.length === 0) {
      missingFields.push('incomes (no income provided)');
    } else {
      state.incomes.forEach((income, index) => {
        if (!income.source) missingFields.push(`incomes[${index}].source`);
        if (!income.monthlyAmount) missingFields.push(`incomes[${index}].monthlyAmount`);
        if (!income.imageUrl.trim()) {
          missingFields.push(`incomes[${index}].imageUrl`);
        }
      });
    }

    // Check Answers - conditionally require explanations if triggered
    if (state.answers.felony && !state.answers.felonyExplanation)
      missingFields.push('answers.felonyExplanation');
    if (state.answers.evicted && !state.answers.evictedExplanation)
      missingFields.push('answers.evictedExplanation');

    const complete = missingFields.length === 0;
    const result = { complete, missingFields };

    if (complete) {
      console.log('Application is complete; marking complete for applicationId:', applicationId);
      markComplete(applicationId);
    }
    console.log('Application Completion Check:', result);
    return result;
  },
}));

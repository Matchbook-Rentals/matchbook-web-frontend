import { create } from 'zustand';
import { VerificationImage } from '@prisma/client';

interface PersonalInfo {
  firstName: string;
  lastName: string;
}

interface Identification {
  idType: string;
  idNumber: string;
}

interface ResidentialHistory {
  currentStreet: string;
  currentApt?: string;
  currentCity: string;
  currentState: string;
  currentZipCode: string;
  housingStatus: 'rent' | 'own';
  monthlyPayment: string;
  durationOfTenancy: string;
}

interface LandlordInfo {
  landlordFirstName: string;
  landlordLastName: string;
  landlordEmail: string;
  landlordPhoneNumber: string;
}

interface Income {
  id?: string;
  source: string;
  monthlyAmount: string;
}

interface QuestionnaireAnswers {
  evicted: boolean;
  felony: boolean;
  felonyExplanation: string;
  evictedExplanation: string;
}

interface ApplicationErrors {
  basicInfo: {
    personalInfo: { firstName?: string; lastName?: string };
    identification: { idType?: string; idNumber?: string };
  };
  residentialHistory: {
    currentStreet?: string;
    currentCity?: string;
    currentState?: string;
    currentZipCode?: string;
    monthlyPayment?: string;
    durationOfTenancy?: string;
  };
  landlordInfo: {
    landlordFirstName?: string;
    landlordLastName?: string;
    landlordEmail?: string;
    landlordPhoneNumber?: string;
  };
  income: {
    source?: string[];
    monthlyAmount?: string[];
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
    lastName: ''
  },
  ids: [{ idType: '', idNumber: '' }],
  verificationImages: [] as VerificationImage[],
  residentialHistory: {
    currentStreet: '',
    currentApt: '',
    currentCity: '',
    currentState: '',
    currentZipCode: '',
    housingStatus: 'rent' as const,
    monthlyPayment: '',
    durationOfTenancy: '',
  },
  landlordInfo: {
    landlordFirstName: '',
    landlordLastName: '',
    landlordEmail: '',
    landlordPhoneNumber: '',
  },
  incomes: [{ source: '', monthlyAmount: '' }],
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
  residentialHistory: ResidentialHistory;
  landlordInfo: LandlordInfo;
  incomes: Income[];
  answers: QuestionnaireAnswers;
  originalData: typeof initialState;

  // Actions
  setPersonalInfo: (info: PersonalInfo) => void;
  setIds: (ids: Identification[]) => void;
  setVerificationImages: (images: VerificationImage[]) => void;
  setResidentialHistory: (history: ResidentialHistory) => void;
  setLandlordInfo: (info: LandlordInfo) => void;
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
}

const initialErrors: ApplicationErrors = {
  basicInfo: {
    personalInfo: {},
    identification: {},
  },
  residentialHistory: {
    currentStreet: '',
    currentCity: '',
    currentState: '',
    currentZipCode: '',
    monthlyPayment: '',
    durationOfTenancy: '',
  },
  landlordInfo: {
    landlordFirstName: '',
    landlordLastName: '',
    landlordEmail: '',
    landlordPhoneNumber: '',
  },
  income: {
    source: [],
    monthlyAmount: [],
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
  setResidentialHistory: (history) => set({ residentialHistory: history }),
  setLandlordInfo: (info) => set({ landlordInfo: info }),
  setIncomes: (incomes) => set({ incomes }),
  setAnswers: (answers) => set({ answers }),

  resetStore: () => set(initialState),

  initializeFromApplication: (application) => {
    if (!application) return;

    const newData = {
      personalInfo: {
        firstName: application.firstName || '',
        lastName: application.lastName || ''
      },
      ids: application.identifications || [{ idType: '', idNumber: '' }],
      verificationImages: application.verificationImages || [] as VerificationImage[],
      residentialHistory: {
        currentStreet: application.currentStreet || '',
        currentApt: application.currentApt || '',
        currentCity: application.currentCity || '',
        currentState: application.currentState || '',
        currentZipCode: application.currentZipCode || '',
        housingStatus: application.housingStatus || 'rent',
        monthlyPayment: application.monthlyPayment || '',
        durationOfTenancy: application.durationOfTenancy || '',
      },
      landlordInfo: {
        landlordFirstName: application.landlordFirstName || '',
        landlordLastName: application.landlordLastName || '',
        landlordEmail: application.landlordEmail || '',
        landlordPhoneNumber: application.landlordPhoneNumber || '',
      },
      incomes: application.incomes?.map((income: any) => ({
        id: income.id || null,
        source: income.source || '',
        monthlyAmount: (income.monthlyAmount || '').toString().replace(/[$,]/g, '').split('.')[0]
      })) || [{ source: '', monthlyAmount: '' }],
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
      landlordInfo: state.landlordInfo,
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
    const { personalInfo, ids, verificationImages, residentialHistory, landlordInfo, incomes, answers } = get();
    const newData = {
      personalInfo,
      ids,
      verificationImages,
      residentialHistory,
      landlordInfo,
      incomes,
      answers,
    };
    set({ originalData: newData });
  },
}));
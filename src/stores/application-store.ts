import { create } from 'zustand';
import { VerificationImage, ImageCategory } from '@/types/application';

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
  source: string;
  monthlyAmount: string;
}

interface QuestionnaireAnswers {
  evicted: boolean;
  brokenLease: boolean;
  landlordDispute: boolean;
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
    questionnaire: string;
  };
}

export const initialState = {
  personalInfo: {
    firstName: '',
    lastName: ''
  },
  ids: [{ idType: '', idNumber: '' }],
  verificationImages: [],
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
    brokenLease: false,
    landlordDispute: false,
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
    questionnaire: '',
  },
};

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  ...initialState,

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

    set({
      personalInfo: {
        firstName: application.firstName || '',
        lastName: application.lastName || ''
      },
      ids: application.identifications || [{ idType: '', idNumber: '' }],
      verificationImages: application.verificationImages || [],
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
        source: income.source || '',
        monthlyAmount: (income.monthlyAmount || '').toString().replace(/[$,]/g, '').split('.')[0]
      })) || [{ source: '', monthlyAmount: '' }],
      answers: {
        evicted: application.evicted || false,
        brokenLease: application.brokenLease || false,
        landlordDispute: application.landlordDispute || false,
        felonyExplanation: application.felonyExplanation || '',
        evictedExplanation: application.evictedExplanation || ''
      }
    });
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
    }) !== JSON.stringify(initialState);
  },

  errors: initialErrors,

  setErrors: (step, errors) => set(state => ({
    errors: {
      ...state.errors,
      [step]: errors
    }
  })),

  clearErrors: () => set({ errors: initialErrors }),
}));
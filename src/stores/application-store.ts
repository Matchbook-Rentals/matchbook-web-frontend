import { create } from 'zustand';
import { VerificationImage } from '@prisma/client';
import { markComplete, absurdApplication } from '@/app/actions/applications';

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

  // <<< NEW ACTION: checkCompletion for determining if the application is complete >>>
  checkCompletion: (applicationId: string) => { complete: boolean; missingFields: string[] };
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
    const {
      personalInfo,
      ids,
      verificationImages,
      residentialHistory,
      landlordInfo,
      incomes,
      answers,
    } = get();
    const newData = {
      personalInfo,
      ids,
      verificationImages,
      residentialHistory,
      landlordInfo,
      incomes,
      answers,
    };
    console.log("markSynced invoked. New data to sync:", newData);
    set({ originalData: newData });
    console.log("Original data updated to:", newData);
  },

  // <<< NEW ACTION: checkCompletion >>>
  checkCompletion: (applicationId: string) => {
    const state = get();
    const missingFields: string[] = [];

    // Check Personal Info
    if (!state.personalInfo.firstName) missingFields.push('personalInfo.firstName');
    if (!state.personalInfo.lastName) missingFields.push('personalInfo.lastName');

    // Check Identification(s)
    if (!state.ids || state.ids.length === 0) {
      missingFields.push('ids (no identification provided)');
    } else {
      state.ids.forEach((id, index) => {
        if (!id.idType) missingFields.push(`ids[${index}].idType`);
        if (!id.idNumber) missingFields.push(`ids[${index}].idNumber`);
      });
    }

    // Check Residential History (required fields)
    if (!state.residentialHistory.currentStreet) missingFields.push('residentialHistory.currentStreet');
    if (!state.residentialHistory.currentCity) missingFields.push('residentialHistory.currentCity');
    if (!state.residentialHistory.currentState) missingFields.push('residentialHistory.currentState');
    if (!state.residentialHistory.currentZipCode) missingFields.push('residentialHistory.currentZipCode');
    if (!state.residentialHistory.monthlyPayment) missingFields.push('residentialHistory.monthlyPayment');
    if (!state.residentialHistory.durationOfTenancy) missingFields.push('residentialHistory.durationOfTenancy');

    // Check Landlord Info
    if (!state.landlordInfo.landlordFirstName) missingFields.push('landlordInfo.landlordFirstName');
    if (!state.landlordInfo.landlordLastName) missingFields.push('landlordInfo.landlordLastName');
    if (!state.landlordInfo.landlordEmail) missingFields.push('landlordInfo.landlordEmail');
    if (!state.landlordInfo.landlordPhoneNumber) missingFields.push('landlordInfo.landlordPhoneNumber');

    // Check Incomes
    if (!state.incomes || state.incomes.length === 0) {
      missingFields.push('incomes (no income provided)');
    } else {
      state.incomes.forEach((income, index) => {
        if (!income.source) missingFields.push(`incomes[${index}].source`);
        if (!income.monthlyAmount) missingFields.push(`incomes[${index}].monthlyAmount`);
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
      console.log("Application is complete; marking complete for applicationId:", applicationId);
      markComplete(applicationId);
    }
    console.log("Application Completion Check:", result);
    return result;
  },
}));
import { create } from 'zustand';
import { VerificationImage } from '@prisma/client';
import { markComplete, upsertApplication, updateApplicationField } from '@/app/actions/applications';
import { ResidentialHistory } from '@prisma/client';
import { 
  validatePersonalInfo, 
  validateIdentification, 
  validateResidentialHistory, 
  validateIncome, 
  validateQuestionnaire 
} from '@/utils/application-validation';
import { checkApplicationCompletionClient } from '@/utils/application-completion';

// Helper function to extract file key from UploadThing URL
function extractFileKeyFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // UploadThing URLs look like: https://utfs.io/f/FILE_KEY or https://APP_ID.ufs.sh/f/FILE_KEY
  const matches = url.match(/\/f\/([^/?]+)/);
  return matches ? matches[1] : undefined;
}

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
  url?: string; // Optional for backward compatibility
  fileKey?: string; // New: for secure file access
  customId?: string; // New: alternative identifier
  fileName?: string; // New: original file name
  isPrimary: boolean;
}


interface Income {
  id?: string;
  source: string;
  monthlyAmount: string;
  imageUrl?: string; // Optional for backward compatibility
  fileKey?: string; // New: for secure file access
  customId?: string; // New: alternative identifier
  fileName?: string; // New: original file name
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
    dateOfBirth: ''
  },
  ids: [{ id: '', idType: '', idNumber: '', isPrimary: true, idPhotos: [] }],
  verificationImages: [] as VerificationImage[],
  residentialHistory: [defaultResidentialHistory],
  preservedResidentialHistory: [] as ResidentialHistory[], // Store for preserving data when trimming
  incomes: [{ source: '', monthlyAmount: '', imageUrl: '' }],
  answers: {
    evicted: false,
    felony: false,
    felonyExplanation: '',
    evictedExplanation: ''
  },
  // Auto-save state
  isSaving: false,
  lastSaveTime: null as Date | null,
  saveError: null as string | null,
  fieldErrors: {} as { [key: string]: string },
  
  // Server completion status
  serverIsComplete: false
};

interface ApplicationState {
  personalInfo: PersonalInfo;
  ids: Identification[];
  verificationImages: VerificationImage[];
  residentialHistory: ResidentialHistory[];
  preservedResidentialHistory: ResidentialHistory[];
  incomes: Income[];
  answers: QuestionnaireAnswers;
  originalData: typeof initialState;

  // Auto-save state
  isSaving: boolean;
  lastSaveTime: Date | null;
  saveError: string | null;
  fieldErrors: { [key: string]: string };
  
  // Server completion status
  serverIsComplete: boolean;

  // Actions
  setPersonalInfo: (info: PersonalInfo) => void;
  setIds: (ids: Identification[]) => void;
  setVerificationImages: (images: VerificationImage[]) => void;
  setResidentialHistory: (history: ResidentialHistory[]) => void;
  setPreservedResidentialHistory: (history: ResidentialHistory[]) => void;
  setIncomes: (incomes: Income[]) => void;
  setAnswers: (answers: QuestionnaireAnswers) => void;
  resetStore: () => void;
  initializeFromApplication: (application: any) => void;

  // Add new property
  isEdited: () => boolean;
  
  // Check if application meets all requirements
  isApplicationComplete: () => boolean;

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

  // Auto-save actions
  setSaving: (isSaving: boolean) => void;
  setSaveError: (error: string | null) => void;
  setFieldError: (fieldPath: string, error: string | null) => void;
  clearFieldError: (fieldPath: string) => void;
  saveField: (fieldPath: string, value: any, options?: { checkCompletion?: boolean }) => Promise<{ success: boolean; error?: string; fieldPath?: string; completionStatus?: any }>;
  validateField: (fieldPath: string, value: any) => string | null;
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
  setPreservedResidentialHistory: (history: ResidentialHistory[]) => set({ preservedResidentialHistory: history }),
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
  setIncomes: (incomes) => set({ incomes: incomes.length === 0 ? [{ source: '', monthlyAmount: '', imageUrl: '' }] : incomes }),
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
        dateOfBirth: application.dateOfBirth || ''
      },
      ids: application.identifications?.map((id: any) => ({
        id: id.id || '',
        idType: id.idType || '',
        idNumber: id.idNumber || '',
        isPrimary: id.isPrimary || false,
        idPhotos: id.idPhotos?.map((photo: any) => ({
          id: photo.id,
          url: photo.url, // Keep for backward compatibility
          fileKey: photo.fileKey || extractFileKeyFromUrl(photo.url), // Extract key from URL if not stored
          customId: photo.customId,
          fileName: photo.fileName,
          isPrimary: photo.isPrimary || false
        })) || []
      })) || [{ id: '', idType: '', idNumber: '', isPrimary: true, idPhotos: [] }],
      verificationImages: application.verificationImages || [] as VerificationImage[],
      residentialHistory: residences,
      incomes: application.incomes?.map((income: any) => ({
        id: income.id || null,
        source: income.source || '',
        monthlyAmount: (income.monthlyAmount || '').toString().replace(/[$,]/g, '').split('.')[0],
        imageUrl: income.imageUrl || '', // Keep for backward compatibility
        fileKey: income.fileKey || extractFileKeyFromUrl(income.imageUrl), // Extract key from URL if not stored
        customId: income.customId,
        fileName: income.fileName
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
    set({ 
      originalData: newData,
      serverIsComplete: application.isComplete || false 
    });
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
  
  isApplicationComplete: () => {
    const state = get();
    
    // Use the centralized completion check
    const result = checkApplicationCompletionClient({
      personalInfo: state.personalInfo,
      ids: state.ids,
      incomes: state.incomes,
      answers: state.answers,
      residentialHistory: state.residentialHistory
    });
    
    return result.isComplete;
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

  // Auto-save actions
  setSaving: (isSaving) => set({ isSaving }),
  setSaveError: (error) => set({ saveError: error }),
  setFieldError: (fieldPath, error) => set(state => ({
    fieldErrors: error 
      ? { ...state.fieldErrors, [fieldPath]: error }
      : Object.fromEntries(Object.entries(state.fieldErrors).filter(([key]) => key !== fieldPath))
  })),
  clearFieldError: (fieldPath) => set(state => ({
    fieldErrors: Object.fromEntries(Object.entries(state.fieldErrors).filter(([key]) => key !== fieldPath))
  })),

  // Validate a single field
  validateField: (fieldPath, value) => {
    const state = get();
    
    // Parse the field path to determine what to validate
    const pathParts = fieldPath.split('.');
    
    if (pathParts[0] === 'personalInfo') {
      const fieldName = pathParts[1];
      
      // Special validation for specific fields
      if (fieldName === 'firstName' && !value?.trim()) {
        return 'First Name is required';
      }
      if (fieldName === 'lastName' && !value?.trim()) {
        return 'Last Name is required';
      }
      if (fieldName === 'middleName' && !state.personalInfo.noMiddleName && !value?.trim()) {
        return 'Middle name is required unless "No Middle Name" is checked';
      }
      if (fieldName === 'dateOfBirth') {
        if (!value) {
          return 'Date of birth is required';
        }
        // Check if user is at least 18 years old
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        
        const isAtLeast18 = age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
        
        if (!isAtLeast18) {
          return 'You must be at least 18 years old';
        }
      }
    }
    
    if (pathParts[0] === 'identifications') {
      const index = parseInt(pathParts[1]);
      const fieldName = pathParts[2];
      
      if (fieldName === 'idType' && !value?.trim()) {
        return 'ID Type is required';
      }
      if (fieldName === 'idNumber' && !value?.trim()) {
        return 'ID Number is required';
      }
    }
    
    if (pathParts[0] === 'incomes') {
      const index = parseInt(pathParts[1]);
      const fieldName = pathParts[2];
      
      if (fieldName === 'source' && !value?.trim()) {
        return 'Income source is required';
      }
      if (fieldName === 'monthlyAmount') {
        const numValue = parseInt(value);
        if (!value?.trim()) {
          return 'Monthly amount is required';
        }
        if (isNaN(numValue) || numValue <= 0) {
          return 'Monthly amount must be greater than 0';
        }
      }
    }
    
    if (pathParts[0] === 'questionnaire') {
      const fieldName = pathParts[1];
      
      if (fieldName === 'felonyExplanation' && state.answers.felony && !value?.trim()) {
        return 'Please provide an explanation';
      }
      if (fieldName === 'evictedExplanation' && state.answers.evicted && !value?.trim()) {
        return 'Please provide an explanation';
      }
    }
    
    if (pathParts[0] === 'residentialHistory') {
      const index = parseInt(pathParts[1]);
      const fieldName = pathParts[2];
      
      if (fieldName === 'durationOfTenancy') {
        const numValue = parseInt(value);
        if (value && (isNaN(numValue) || numValue <= 0)) {
          return 'Duration must be greater than 0';
        }
      }
      
      // Required field validations
      if (fieldName === 'street' && !value?.trim()) {
        return 'Street Address is required';
      }
      if (fieldName === 'city' && !value?.trim()) {
        return 'City is required';
      }
      if (fieldName === 'state' && !value?.trim()) {
        return 'State is required';
      }
      if (fieldName === 'zipCode' && !value?.trim()) {
        return 'ZIP Code is required';
      }
      if (fieldName === 'monthlyPayment' && !value?.trim()) {
        return 'Monthly Payment is required';
      }
    }
    
    return null;
  },

  // Save a single field with debouncing handled by the component
  saveField: async (fieldPath, value, options) => {
    const state = get();
    
    // Validate the field first
    const error = get().validateField(fieldPath, value);
    if (error) {
      get().setFieldError(fieldPath, error);
      return { success: false, error };
    } else {
      get().clearFieldError(fieldPath);
    }
    
    // Set saving state
    set({ isSaving: true, saveError: null });
    
    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Auto-Save] Saving field: ${fieldPath} with value:`, value, 'options:', options);
    }
    
    try {
      // Use the new updateApplicationField function for individual field updates
      const result = await updateApplicationField(fieldPath, value, state.tripId, options?.checkCompletion);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auto-Save] Server response:', result);
      }
      
      if (result.success) {
        // Update server completion status if provided
        const updates: any = { 
          isSaving: false, 
          lastSaveTime: new Date(),
          saveError: null 
        };
        
        if (result.isComplete !== undefined) {
          updates.serverIsComplete = result.isComplete;
        }
        
        set(updates);
        
        // Update original data to reflect saved state for this specific field
        const pathParts = fieldPath.split('.');
        if (pathParts.length === 1) {
          (state.originalData as any)[fieldPath] = value;
        } else {
          const [parent, child] = pathParts;
          if (!(state.originalData as any)[parent]) {
            (state.originalData as any)[parent] = {};
          }
          (state.originalData as any)[parent][child] = value;
        }
        
        return { 
          success: true, 
          fieldPath, 
          completionStatus: result.completionStatus,
          isComplete: result.isComplete 
        };
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('[Auto-Save] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      set({ 
        isSaving: false, 
        saveError: errorMessage
      });
      return { success: false, error: errorMessage, fieldPath };
    }
  },
}));

'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Eye, EyeOff, ChevronDown, FileText, User, Save, Send } from 'lucide-react';

import { PDFViewer, OnPDFViewerPageClick } from './PDFViewer';
import { FieldItem } from './FieldItem';
import { FieldSelector } from './FieldSelector';
import { SignableField } from './SignableField';
import { RecipientManager, type Recipient } from './RecipientManager';
import { getRecipientColor } from './recipient-colors';
import { TemplateBrowser } from './TemplateBrowser';
import { DocumentTemplateSelector } from './DocumentTemplateSelector';
import { DocumentSelector } from './DocumentSelector';
import { TripConfiguration } from './TripConfiguration';
import { MobilePDFWrapper } from './MobilePDFWrapper';
import { CustomFieldDialog } from './CustomFieldDialog';
import { TextFieldConfigModal } from './TextFieldConfigModal';
import { FieldValidationModal } from './FieldValidationModal';
import { FieldValueEditModal } from './FieldValueEditModal';
import { FrequentlyUsedFields } from './FrequentlyUsedFields';
import { FieldFormType, FieldType, MatchDetails, FieldMeta, ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING, FRIENDLY_FIELD_TYPE } from './types';
import { TemplateSidebar } from './sidebars/TemplateSidebar';
import { DocumentSidebar } from './sidebars/DocumentSidebar';
import { SigningSidebar } from './sidebars/SigningSidebar';
import { MobileFieldFAB, MobileFieldDrawer, MobilePlacementToast } from './mobile';
import { createFieldAtPosition, getPage, isWithinPageBounds, getFieldBounds, findBestPositionForSignDate, findBestPositionForInitialDate } from './field-utils';
import { PdfTemplate } from '@prisma/client';
import { handleSignerCompletion } from '@/app/actions/documents';
import { updateUserInitials } from '@/app/actions/user';
import BrandModal from '@/components/BrandModal';
import { useBrandAlert, createBrandAlert, createBrandConfirm } from '@/hooks/useBrandAlert';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';
import { useStepCompletion } from '@/hooks/useStepCompletion';

// Service layer functions
import { saveTemplateAndCreateDocument as saveTemplateService, loadTemplate as loadTemplateService } from '@/services/templateService';
import { saveDocumentAndStartSigning as saveDocumentAndStartSigningService, loadDocumentForSigning as loadDocumentForSigningService, createDocumentAndStartSigning as createDocumentAndStartSigningService, saveDocument as saveDocumentService } from '@/services/documentService';
import { saveSignerProgressAsync as saveSignerProgressAsyncService, saveSignerProgressAndContinue as saveSignerProgressAndContinueService } from '@/services/signingService';

// Utility functions
import { getFieldLabel } from '@/utils/fieldLabelUtils';
import { getUnsignedFields as getUnsignedFieldsUtil } from '@/utils/fieldFilterUtils';
import { navigateToField as navigateToFieldUtil, navigateToNextField as navigateToNextFieldUtil } from '@/utils/fieldNavigationUtils';

// New workflow system
import { useWorkflowStateMachine } from '@/features/lease-signing/hooks/useWorkflowStateMachine';
import { WorkflowPhase, WorkflowState as NewWorkflowState } from '@/features/lease-signing/types/workflow.types';
import { legacyStateToPhase, phaseToLegacyState, createWorkflowStateFromLegacy, getSignerIndexFromLegacy } from '@/features/lease-signing/adapters/workflowAdapter';
import {
  isEditablePhase,
  shouldShowFieldBorders,
  shouldShowRecipientSelector,
  shouldShowSignatureTools,
  shouldAllowFieldEditing,
  getFieldsForCurrentSigner,
  areAllRequiredFieldsSigned,
  canTransitionFromDocument,
  getSignerLabel
} from '@/features/lease-signing/utils/workflowHelpers';
import {
  calculateFieldProgress,
  getIncompleteFields,
  areAllSignerFieldsComplete,
  isSigningField
} from '@/features/lease-signing/utils/fieldDecomposition';

// Template data interface for the editor
interface LoadedTemplate {
  id: string;
  title: string;
  description?: string;
  fields: any[];
  recipients: any[];
  metadata?: any;
  pdfFileUrl: string;
  pdfFileName: string;
  createdAt: Date;
  updatedAt: Date;
}
import { nanoid } from 'nanoid';

interface UserSignature {
  id: string;
  type: 'drawn' | 'typed';
  data: string;
  fontFamily?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Legacy workflow states for backward compatibility
type LegacyWorkflowState = 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed';

interface PDFEditorProps {
  initialWorkflowState?: LegacyWorkflowState;
  initialPdfFile?: File;
  initialFields?: FieldFormType[];
  initialRecipients?: Recipient[];
  initialTemplate?: any;
  templateType?: 'lease' | 'addendum' | 'disclosure' | 'other';
  templateName?: string;
  isMergedDocument?: boolean;
  mergedTemplateIds?: string[];
  matchDetails?: MatchDetails;
  housingRequestId?: string;
  currentUserEmail?: string;
  hostName?: string;
  hostEmail?: string;
  listingAddress?: string;
  listingId?: string;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
  onFieldSign?: (fieldId: string, value: any) => void;
  onDocumentCreated?: (documentId: string) => void;
  customSidebarContent?: (workflowState: LegacyWorkflowState, defaultContent: JSX.Element) => JSX.Element;
  showFooter?: boolean;
  hideFooterControls?: boolean;
  onCompleteStepReady?: (completeStepFn: () => Promise<void>) => void;
  contentHeight?: string;
  signerRole?: 'host' | 'renter';
  onWorkflowStateChange?: (newState: LegacyWorkflowState) => void;
  onSigningActionReady?: (signingActionFn: () => Promise<void>) => void;
  // signedFields is now provided by context
  currentUserInitials?: string; // User's saved initials passed from parent
  currentUserName?: string; // User's name for generating initials
  pageWidth?: number; // Custom page width for responsive design
  isMobile?: boolean; // Whether to use mobile-optimized layout
  hideDefaultSidebar?: boolean; // Whether to hide the internal sidebar
}

export const PDFEditor: React.FC<PDFEditorProps> = ({
  initialWorkflowState = 'selection',
  initialPdfFile,
  initialFields,
  initialRecipients,
  initialTemplate,
  templateType = 'lease',
  templateName,
  isMergedDocument = false,
  mergedTemplateIds,
  matchDetails,
  housingRequestId,
  currentUserEmail,
  hostName,
  hostEmail,
  listingAddress,
  listingId,
  onSave,
  onCancel,
  onFinish,
  onFieldSign,
  onDocumentCreated,
  customSidebarContent,
  showFooter = true,
  hideFooterControls = false,
  onCompleteStepReady,
  contentHeight = 'calc(100vh - 100px)',
  signerRole,
  onWorkflowStateChange,
  onSigningActionReady,
  currentUserInitials: initialUserInitials,
  currentUserName,
  pageWidth: customPageWidth = 800,
  isMobile = false,
  hideDefaultSidebar = false
}) => {
  const router = useRouter();
  const { showAlert, showConfirm } = useBrandAlert();
  const brandAlert = createBrandAlert(showAlert);
  const brandConfirm = createBrandConfirm(showConfirm);
  const { signedFields, setSignedField } = useSignedFieldsStore();
  const [pdfFile, setPdfFile] = useState<File | null>(initialPdfFile || null);
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients || []);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [pendingFieldLabel, setPendingFieldLabel] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFieldLabels, setShowFieldLabels] = useState(true);
  const [pageWidth, setPageWidth] = useState(customPageWidth);

  // Initialize new workflow system
  const initialPhase = legacyStateToPhase(initialWorkflowState);
  const workflow = useWorkflowStateMachine(initialPhase);

  // Fix: Initialize signer index by matching current user email to recipients
  useEffect(() => {
    // Only initialize if we're in a signing phase
    if (initialPhase !== 'signing') return;

    // Find current signer index by matching email
    let currentSignerIndex = 0;

    if (currentUserEmail && recipients.length > 0) {
      const matchedIndex = recipients.findIndex(r => r.email === currentUserEmail);
      if (matchedIndex !== -1) {
        currentSignerIndex = matchedIndex;
        console.log('✅ PDFEditor - Matched current user email to recipient:', {
          currentUserEmail,
          matchedIndex,
          recipient: recipients[matchedIndex]
        });
      } else {
        console.warn('⚠️ PDFEditor - Could not match current user email to any recipient:', {
          currentUserEmail,
          recipients: recipients.map(r => r.email)
        });
        // Fallback to legacy logic
        const legacyIndex = getSignerIndexFromLegacy(initialWorkflowState);
        currentSignerIndex = legacyIndex ?? 0;
      }
    } else if (initialWorkflowState) {
      // Fallback to legacy signer index if no email provided
      const legacyIndex = getSignerIndexFromLegacy(initialWorkflowState);
      currentSignerIndex = legacyIndex ?? 0;
      console.log('⚠️ PDFEditor - Using legacy signer index (no email):', currentSignerIndex);
    }

    console.log('🔧 PDFEditor - Initializing workflow with signer index:', {
      currentSignerIndex,
      recipientCount: recipients.length,
      currentUserEmail
    });

    // Dispatch START_SIGNING to properly set up signer state
    workflow.dispatch({
      type: 'START_SIGNING',
      signerCount: recipients.length || 2,
      documentId: sessionStorage.getItem('currentDocumentId') || undefined,
      signingOrder: recipients.map((r, i) => `signer-${i}`)
    });

    // Advance workflow to the matched signer index
    if (currentSignerIndex > 0) {
      // Mark all previous signers as completed and advance
      for (let i = 0; i < currentSignerIndex; i++) {
        workflow.dispatch({ type: 'COMPLETE_SIGNER', signerId: `signer-${i}` });
        workflow.dispatch({ type: 'ADVANCE_TO_NEXT_SIGNER' });
      }
    }
  }, []); // Only run once on mount

  // Debug: Log workflow initialization
  useEffect(() => {
    console.error('🔧 PDFEditor - Workflow initialized:', {
      initialWorkflowState,
      initialPhase,
      currentPhase: workflow.state.phase,
      currentSignerIndex: workflow.getCurrentSignerIndex(),
      isTemplatePhase: workflow.isTemplatePhase(),
      isDocumentPhase: workflow.isDocumentPhase(),
      isSigningPhase: workflow.isSigningPhase(),
      hasInitialTemplate: !!initialTemplate
    });
  }, [workflow.state.phase, workflow.getCurrentSignerIndex()]);

  // Legacy state management for backward compatibility
  const [legacyWorkflowState, setLegacyWorkflowStateInternal] = useState<LegacyWorkflowState>(initialWorkflowState);

  // Keep legacy state in sync with new workflow and notify parent of changes
  useEffect(() => {
    const newLegacyState = phaseToLegacyState(workflow.state.phase, workflow.getCurrentSignerIndex());
    if (newLegacyState !== legacyWorkflowState) {
      setLegacyWorkflowStateInternal(newLegacyState);
      if (onWorkflowStateChange) {
        onWorkflowStateChange(newLegacyState);
      }
    }
  }, [workflow.state.phase, workflow.getCurrentSignerIndex()]);

  // Wrapper function for legacy code that still uses setWorkflowState
  const setWorkflowState = (newState: LegacyWorkflowState) => {
    const newPhase = legacyStateToPhase(newState);
    workflow.transitionToPhase(newPhase);
  };

  // Load initialTemplate if provided (for editing existing templates)
  useEffect(() => {
    if (!initialTemplate) return;

    const loadInitialTemplate = async () => {
      try {
        console.error('🔧 PDFEditor - Loading initialTemplate:', {
          templateId: initialTemplate.id,
          hasPdfUrl: !!initialTemplate.pdfFileUrl,
          hasFields: !!initialTemplate.fields,
          hasRecipients: !!initialTemplate.recipients
        });

        // Load PDF file from URL
        if (initialTemplate.pdfFileUrl) {
          const response = await fetch(initialTemplate.pdfFileUrl);
          const blob = await response.blob();
          const file = new File([blob], initialTemplate.pdfFileName || 'template.pdf', {
            type: 'application/pdf'
          });
          setPdfFile(file);
        }

        // Load fields
        if (initialTemplate.fields && Array.isArray(initialTemplate.fields)) {
          setFields(initialTemplate.fields as FieldFormType[]);
        }

        // Load recipients
        if (initialTemplate.recipients && Array.isArray(initialTemplate.recipients)) {
          setRecipients(initialTemplate.recipients as Recipient[]);
        }

        console.error('✅ PDFEditor - initialTemplate loaded successfully');
      } catch (error) {
        console.error('❌ PDFEditor - Failed to load initialTemplate:', error);
      }
    };

    loadInitialTemplate();
  }, [initialTemplate]);

  // signedFields now comes from context
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Debug log for signedFields changes
  // Removed verbose logging - keeping only essential debug logs
  const [stepCompleted, setStepCompleted] = useState(false);

  // Interaction mode state
  const [interactionMode, setInteractionMode] = useState<'idle' | 'detecting' | 'dragging' | 'click-to-place'>('idle');
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Template browser state
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);

  // Mobile field drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Document selector state
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [pendingSignerType, setPendingSignerType] = useState<'signer1' | 'signer2' | null>(null);

  // Field rendering state
  const [fieldsRendered, setFieldsRendered] = useState(false);
  const [renderingStatus, setRenderingStatus] = useState<'pending' | 'checking' | 'rendered' | 'failed'>('pending');

  // Trip configuration state
  const [tripMatchDetails, setTripMatchDetails] = useState<MatchDetails | null>(matchDetails || null);
  const [showTripConfiguration, setShowTripConfiguration] = useState(!matchDetails && workflow.isDocumentPhase());

  // Document creation loading state
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  // Saved signatures state
  const [savedSignatures, setSavedSignatures] = useState<UserSignature[]>([]);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(false);

  // Client-side user initials state (starts with initial value, updates when user saves)
  const [currentUserInitials, setCurrentUserInitials] = useState<string | undefined>(initialUserInitials);


  // Accordion states
  const [accordionStates, setAccordionStates] = useState({
    documentInfo: true,
    recipients: true,
    fieldTypes: true,
    allFieldTypes: true
  });

  // Ghost cursor state for field placement
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const fieldBounds = useRef({ width: 0, height: 0 });
  const pdfEditorContainerRef = useRef<HTMLDivElement>(null);

  // Fields state
  const [fields, setFields] = useState<FieldFormType[]>(initialFields || []);

  // Sync fields state when initialFields prop changes (e.g., after filtering)
  useEffect(() => {
    if (initialFields && initialFields.length > 0) {
      console.log('🔄 PDFEditor - Syncing fields from initialFields prop:', {
        currentFieldCount: fields.length,
        newFieldCount: initialFields.length,
        fieldsChanged: fields.length !== initialFields.length
      });
      setFields(initialFields);
    }
  }, [initialFields?.length]);

  // Initialize signedFields with pre-filled values from initialFields
  useEffect(() => {
    if (initialFields && initialFields.length > 0) {
      const preFilledValues: Record<string, any> = {};

      initialFields.forEach(field => {
        if (field.value !== undefined && field.value !== null && field.value !== '') {
          preFilledValues[field.formId] = field.value;
        }
      });
    }
  }, [initialFields]);

  // PDF page tracking state
  const [pdfPagesReady, setPdfPagesReady] = useState(false);
  const [pageElements, setPageElements] = useState<Map<number, HTMLElement>>(new Map());

  // Custom field dialog state
  const [customFieldDialog, setCustomFieldDialog] = useState<{
    isOpen: boolean;
    field: FieldFormType | null;
  }>({ isOpen: false, field: null });

  // Text field configuration modal state
  const [textFieldConfigModal, setTextFieldConfigModal] = useState<{
    isOpen: boolean;
    field: FieldFormType | null;
  }>({ isOpen: false, field: null });

  // Field value edit modal state (for document mode)
  const [fieldValueEditModal, setFieldValueEditModal] = useState<{
    isOpen: boolean;
    field: FieldFormType | null;
  }>({ isOpen: false, field: null });

  // Field validation modal state
  const [showFieldValidationModal, setShowFieldValidationModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Movement threshold for detecting drag vs click
  const MOVEMENT_THRESHOLD = 10;

  // Debug: Monitor fields state changes
  useEffect(() => {
  }, [fields]);


  // Pre-populate fields with match details
  const prePopulateFieldsWithMatchDetails = useCallback((matchDetails: MatchDetails) => {
    // Log the match details being used for field population
    const logFieldPopulation = async () => {
      try {
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'info',
            message: 'PDFEditor Field Auto-Population with MatchDetails',
            data: {
              monthlyPrice: matchDetails.monthlyPrice,
              propertyAddress: matchDetails.propertyAddress,
              startDate: matchDetails.startDate,
              endDate: matchDetails.endDate,
              hostName: matchDetails.hostName,
              primaryRenterName: matchDetails.primaryRenterName,
              fieldsCount: fields.length,
              fieldTypes: fields.map(f => ({ type: f.type, id: f.formId, label: f.fieldMeta?.label }))
            }
          }),
        });
      } catch (error) {
        console.error('Failed to log field population:', error);
      }
    };

    logFieldPopulation();

    // Update recipients with match details using functional update
    setRecipients(currentRecipients =>
      currentRecipients.map(r => {
        if (r.role === 'HOST') {
          return { ...r, name: matchDetails.hostName, email: matchDetails.hostEmail };
        } else if (r.role === 'RENTER') {
          return { ...r, name: matchDetails.primaryRenterName, email: matchDetails.primaryRenterEmail };
        }
        return r;
      })
    );

    // Auto-population of fields is now handled by the parent component
    // which passes signedFields as a prop
  }, [fields]);

  // Initialize mandatory recipients when starting
  useEffect(() => {
    if (recipients.length === 0) {
      const mandatoryRecipients: Recipient[] = [
        {
          id: 'host-recipient',
          name: hostName || '[Host Name]', // Use actual host name if available
          email: hostEmail || 'host@template.placeholder',
          color: '#0B6E6E', // host color
          title: 'Host',
          role: 'HOST', // Add role for better matching
          isLocked: true
        },
        {
          id: 'primary-renter-recipient',
          name: '[Primary Renter Name]', // Template placeholder
          email: 'renter@template.placeholder',
          color: '#fb8c00', // primary renter color
          title: 'Primary Renter',
          role: 'RENTER', // Add role for better matching
          isLocked: true
        }
      ];

      setRecipients(mandatoryRecipients);
      setSelectedRecipient(mandatoryRecipients[0].id);
    }
  }, [recipients.length, hostName, hostEmail]);

  // Update field bounds when selected field changes
  useEffect(() => {
    if (selectedField) {
      fieldBounds.current = getFieldBounds(selectedField);
    }
  }, [selectedField]);

  // Pre-populate fields with match details when available
  useEffect(() => {
    if (tripMatchDetails && fields.length > 0 && workflow.isDocumentPhase() && pdfPagesReady) {
      prePopulateFieldsWithMatchDetails(tripMatchDetails);
    }
  }, [tripMatchDetails, fields.length, legacyWorkflowState, pdfPagesReady, prePopulateFieldsWithMatchDetails]);

  // Wait for PDF pages to be rendered in DOM and store their references
  useEffect(() => {
    if (!pdfFile) {
      setPdfPagesReady(false);
      setPageElements(new Map());
      return;
    }

    const checkForPdfPages = () => {
      const pdfPageElements = document.querySelectorAll('[data-pdf-viewer-page]');

      if (pdfPageElements.length === 0) {
        // PDF not rendered yet, try again
        return false;
      }

      // Store all page elements by page number
      const newPageElements = new Map<number, HTMLElement>();
      let allPagesHaveContent = true;

      pdfPageElements.forEach((element) => {
        const pageNumber = parseInt(element.getAttribute('data-page-number') || '1');
        const htmlElement = element as HTMLElement;

        // Check if page has actual content (not just empty container)
        const hasContent = htmlElement.clientHeight > 0 && htmlElement.clientWidth > 0;

        if (hasContent) {
          newPageElements.set(pageNumber, htmlElement);
        } else {
          allPagesHaveContent = false;
        }
      });

      if (allPagesHaveContent && newPageElements.size > 0) {
        setPageElements(newPageElements);
        setPdfPagesReady(true);
        return true;
      }

      return false;
    };

    // Initial check
    if (checkForPdfPages()) {
      return;
    }

    // Set up polling to check for PDF pages
    const pollInterval = setInterval(() => {
      if (checkForPdfPages()) {
        clearInterval(pollInterval);
      }
    }, 100);

    // Cleanup after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      // Set pages as ready anyway since fields are rendering successfully
      setPdfPagesReady(true);
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [pdfFile]);

  // Mouse tracking for ghost cursor and drag behavior
  useEffect(() => {
    if (!selectedField || !isDragging || !pdfEditorContainerRef.current) {
      return;
    }

    const container = pdfEditorContainerRef.current;

    const onMouseMove = (event: MouseEvent) => {
      setIsFieldWithinBounds(
        isWithinPageBounds(
          event,
          '[data-pdf-viewer-page]',
          fieldBounds.current.width,
          fieldBounds.current.height,
        ),
      );

      setCoords({
        x: event.clientX - fieldBounds.current.width / 2,
        y: event.clientY - fieldBounds.current.height / 2,
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelFieldPlacement();
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      // Check if click is over a PDF page - if not, cancel field placement
      const pdfArea = (event.target as Element).closest('[data-pdf-viewer-page]');
      if (!pdfArea) {
        cancelFieldPlacement();
      }
    };

    // Always add mousemove and keydown immediately
    container.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', onKeyDown); // Keep keyboard on document for global escape

    // Add mousedown listener with a small delay to avoid canceling immediately after button click
    const timeoutId = setTimeout(() => {
      container.addEventListener('mousedown', onMouseDown);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('mousedown', onMouseDown);
    };
  }, [selectedField, isDragging]);

  // Dual interaction mode detection
  useEffect(() => {
    if (interactionMode === 'idle' || !pdfEditorContainerRef.current) {
      return;
    }

    const container = pdfEditorContainerRef.current;

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (interactionMode === 'detecting' && isMouseDown) {
        const distance = Math.sqrt(
          Math.pow(event.clientX - mouseDownPosition.x, 2) +
          Math.pow(event.clientY - mouseDownPosition.y, 2)
        );

        if (distance > MOVEMENT_THRESHOLD) {
          setInteractionMode('dragging');
          setIsDragging(true);
        }
      }

      // Update cursor position for both modes
      if (interactionMode === 'dragging' || interactionMode === 'click-to-place') {
        setCoords({
          x: event.clientX - fieldBounds.current.width / 2,
          y: event.clientY - fieldBounds.current.height / 2,
        });

        setIsFieldWithinBounds(
          isWithinPageBounds(
            event,
            '[data-pdf-viewer-page]',
            fieldBounds.current.width,
            fieldBounds.current.height,
          ),
        );
      }
    };

    const handleGlobalMouseUp = (event: MouseEvent) => {
      if (interactionMode === 'detecting') {
        setInteractionMode('click-to-place');
        setIsDragging(true);
        setIsMouseDown(false);
      } else if (interactionMode === 'dragging') {
        // Find the actual page element under the mouse (works for any page, not just page 1)
        const pdfPageElement = (event.target as Element).closest('[data-pdf-viewer-page]');
        if (pdfPageElement) {
          const rect = pdfPageElement.getBoundingClientRect();
          const pageNumber = parseInt(pdfPageElement.getAttribute('data-page-number') || '1');
          const syntheticEvent = {
            pageNumber,
            numPages: document.querySelectorAll('[data-pdf-viewer-page]').length,
            originalEvent: event as any,
            pageHeight: rect.height,
            pageWidth: rect.width,
            pageX: event.clientX - rect.left,
            pageY: event.clientY - rect.top,
          };
          handlePageClick(syntheticEvent);
        } else {
          cancelFieldPlacement();
        }
        setIsMouseDown(false);
      }
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelFieldPlacement();
      }
    };

    container.addEventListener('mousemove', handleGlobalMouseMove);
    container.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleGlobalKeyDown); // Keep keyboard on document for global escape

    return () => {
      container.removeEventListener('mousemove', handleGlobalMouseMove);
      container.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [interactionMode, isMouseDown, mouseDownPosition, MOVEMENT_THRESHOLD, handlePageClick]);

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]?.type === 'application/pdf') {
      const newFile = acceptedFiles[0];
      setPdfFile(newFile);
      // Reset state when new PDF is loaded
      setFields([]);
      setActiveFieldId(null);
      setSelectedField(null);
    }
  }, [setFields]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  // Handle clicking on PDF to add field (supports both click-to-place and drag modes)
  function handlePageClick(event: Parameters<OnPDFViewerPageClick>[0]) {
    if (!selectedField || !selectedRecipient || (interactionMode !== 'click-to-place' && interactionMode !== 'dragging' && interactionMode !== 'detecting')) {
      return;
    }

    // Get field dimensions
    const fieldDimensions = getFieldBounds(selectedField);

    // Check if field would fit within page bounds (using centered positioning like ghost cursor)
    const fieldLeftEdge = event.pageX - fieldDimensions.width / 2;
    const fieldRightEdge = event.pageX + fieldDimensions.width / 2;
    const fieldTopEdge = event.pageY - fieldDimensions.height / 2;
    const fieldBottomEdge = event.pageY + fieldDimensions.height / 2;

    const wouldFitX = fieldLeftEdge >= 0 && fieldRightEdge <= event.pageWidth;
    const wouldFitY = fieldTopEdge >= 0 && fieldBottomEdge <= event.pageHeight;

    // Implement best-fit placement if field would go out of bounds
    let adjustedPageX = event.pageX;
    let adjustedPageY = event.pageY;

    if (!wouldFitX || !wouldFitY) {
      // Adjust X position if needed
      if (fieldLeftEdge < 0) {
        adjustedPageX = fieldDimensions.width / 2; // Move right to fit left edge
      } else if (fieldRightEdge > event.pageWidth) {
        adjustedPageX = event.pageWidth - fieldDimensions.width / 2; // Move left to fit right edge
      }

      // Adjust Y position if needed
      if (fieldTopEdge < 0) {
        adjustedPageY = fieldDimensions.height / 2; // Move down to fit top edge
      } else if (fieldBottomEdge > event.pageHeight) {
        adjustedPageY = event.pageHeight - fieldDimensions.height / 2; // Move up to fit bottom edge
      }
    }

    // Calculate percentage-based coordinates using adjusted positions
    const pageX = ((adjustedPageX - fieldDimensions.width / 2) / event.pageWidth) * 100;
    const pageY = ((adjustedPageY - fieldDimensions.height / 2) / event.pageHeight) * 100;
    const fieldPageWidth = (fieldDimensions.width / event.pageWidth) * 100;
    const fieldPageHeight = (fieldDimensions.height / event.pageHeight) * 100;

    // Ensure field stays within bounds
    const clampedPageX = Math.max(0, Math.min(pageX, 100 - fieldPageWidth));
    const clampedPageY = Math.max(0, Math.min(pageY, 100 - fieldPageHeight));

    const recipientIndex = recipients.findIndex(r => r.id === selectedRecipient);

    // Validate host-only field types
    const isHostOnlyField = selectedField === FieldType.TEXT || selectedField === FieldType.NUMBER;
    const isHostSelected = recipientIndex === 0; // Host is always index 0

    if (isHostOnlyField && !isHostSelected) {
      toast({
        title: "Field type restricted",
        description: "Text and Number fields can only be assigned to the host.",
        variant: "destructive",
      });
      // Clean up states
      setSelectedField(null);
      setPendingFieldLabel(null);
      setIsDragging(false);
      setInteractionMode('idle');
      setIsMouseDown(false);
      return;
    }

    // Create new field
    const newField: FieldFormType = {
      formId: nanoid(12),
      type: selectedField,
      pageNumber: event.pageNumber,
      pageX: clampedPageX,
      pageY: clampedPageY,
      pageWidth: fieldPageWidth,
      pageHeight: fieldPageHeight,
      // Always assign recipient, even in template mode
      signerEmail: selectedRecipient,
      recipientIndex,
      // Add specific field label if set from required field buttons or default for text fields
      fieldMeta: pendingFieldLabel
        ? { label: pendingFieldLabel }
        : selectedField === FieldType.TEXT
          ? { label: 'Text' }
          : undefined,
    };

    // Field types that should trigger the custom field dialog
    const customFieldTypes = [FieldType.NAME, FieldType.CHECKBOX, FieldType.DROPDOWN];

    // Clean up states first to prevent re-renders
    setSelectedField(null);
    setPendingFieldLabel(null);
    setIsDragging(false);
    setInteractionMode('idle');
    setIsMouseDown(false);

    if (customFieldTypes.includes(selectedField) && !pendingFieldLabel) {
      // Only open dialog if NOT from required fields (no pendingFieldLabel)
      setCustomFieldDialog({ isOpen: true, field: newField });
    } else {
      // For required fields or non-custom fields, add directly
      if (pendingFieldLabel) {
        // Add predefined metadata for ALL required fields
        const fieldWithMetadata = {
          ...newField,
          fieldMeta: {
            label: pendingFieldLabel,
            // Add specific metadata based on field type and label
            ...(selectedField === FieldType.NUMBER && pendingFieldLabel === 'Rent Amount' && {
              placeholder: '$0.00',
              required: true
            }),
            ...(selectedField === FieldType.NAME && pendingFieldLabel === 'Host Name' && {
              placeholder: 'Enter host name',
              required: true
            }),
            ...(selectedField === FieldType.NAME && pendingFieldLabel === 'Renter Name' && {
              placeholder: 'Enter renter name',
              required: true
            }),
            ...(selectedField === FieldType.EMAIL && pendingFieldLabel === 'Host Email' && {
              placeholder: hostEmail || 'Enter host email',
              defaultValue: hostEmail || '',
              required: true
            }),
            ...(selectedField === FieldType.EMAIL && pendingFieldLabel === 'Primary Renter Email' && {
              placeholder: 'Enter renter email',
              required: true
            }),
            ...(selectedField === FieldType.EMAIL && pendingFieldLabel?.includes('Renter #') && {
              placeholder: 'Enter renter email',
              required: true
            }),
            ...(selectedField === FieldType.DATE && (pendingFieldLabel === 'Move In Date' || pendingFieldLabel === 'Move Out Date') && {
              required: true
            })
          }
        };
        setFields([...fields, fieldWithMetadata]);
        setActiveFieldId(fieldWithMetadata.formId);
      } else {
        // Non-custom fields (signatures, initials, etc.)
        setFields([...fields, newField]);
        setActiveFieldId(newField.formId);
      }
    }
  }

  // Update field position/size
  const updateField = (formId: string, newBounds: { x: number; y: number; width: number; height: number }) => {
    const field = fields.find(f => f.formId === formId);
    if (!field) return;

    // Find the page element to convert pixels back to percentages
    const pageElement = document.querySelector(`[data-pdf-viewer-page][data-page-number="${field.pageNumber}"]`) as HTMLElement;
    if (!pageElement) return;

    const { width: pageWidth, height: pageHeight } = pageElement.getBoundingClientRect();

    // Convert pixels to percentages
    const pageX = (newBounds.x / pageWidth) * 100;
    const pageY = (newBounds.y / pageHeight) * 100;
    const fieldPageWidth = (newBounds.width / pageWidth) * 100;
    const fieldPageHeight = (newBounds.height / pageHeight) * 100;

    const updatedFields = fields.map(f =>
      f.formId === formId
        ? { ...f, pageX, pageY, pageWidth: fieldPageWidth, pageHeight: fieldPageHeight }
        : f
    );
    setFields(updatedFields);

    const updatedField = updatedFields.find(f => f.formId === formId);
  };


  // Remove field
  const removeField = (formId: string) => {
    const fieldToRemove = fields.find(f => f.formId === formId);
    setFields(fields.filter((field) => field.formId !== formId));
    if (activeFieldId === formId) {
      setActiveFieldId(null);
    }
  };

  // Add sign date field next to signature field
  const handleAddSignDate = (signatureFieldId: string) => {
    const signatureField = fields.find(f => f.formId === signatureFieldId);
    if (!signatureField || signatureField.type !== FieldType.SIGNATURE) {
      return;
    }

    // Check if a sign date already exists for this recipient
    const existingSignDate = fields.find(f =>
      f.type === FieldType.SIGN_DATE &&
      f.recipientIndex === signatureField.recipientIndex
    );

    if (existingSignDate) {
      return;
    }

    // Get the page element for positioning
    const pageElement = document.querySelector(
      `[data-pdf-viewer-page][data-page-number="${signatureField.pageNumber}"]`
    ) as HTMLElement;

    if (!pageElement) {
      return;
    }

    // Find the best position for the sign date field
    const position = findBestPositionForSignDate(signatureField, fields, pageElement);

    // Create the sign date field
    const signDateField: FieldFormType = {
      formId: nanoid(12),
      type: FieldType.SIGN_DATE,
      pageNumber: signatureField.pageNumber,
      ...position,
      signerEmail: signatureField.signerEmail,
      recipientIndex: signatureField.recipientIndex,
      fieldMeta: {
        label: 'Sign Date',
        required: true
      }
    };

    // Add the field to the array
    setFields([...fields, signDateField]);
    setActiveFieldId(signDateField.formId);
  };

  // Add initial date field next to initials field
  const handleAddInitialDate = (initialsFieldId: string) => {
    const initialsField = fields.find(f => f.formId === initialsFieldId);
    if (!initialsField || initialsField.type !== FieldType.INITIALS) {
      return;
    }

    // Check if an initial date already exists for this recipient
    const existingInitialDate = fields.find(f =>
      f.type === FieldType.INITIAL_DATE &&
      f.recipientIndex === initialsField.recipientIndex
    );

    if (existingInitialDate) {
      return;
    }

    // Get the page element for positioning
    const pageElement = document.querySelector(
      `[data-pdf-viewer-page][data-page-number="${initialsField.pageNumber}"]`
    ) as HTMLElement;

    if (!pageElement) {
      return;
    }

    // Find the best position for the initial date field
    const position = findBestPositionForInitialDate(initialsField, fields, pageElement);

    // Create the initial date field
    const initialDateField: FieldFormType = {
      formId: nanoid(12),
      type: FieldType.INITIAL_DATE,
      pageNumber: initialsField.pageNumber,
      ...position,
      signerEmail: initialsField.signerEmail,
      recipientIndex: initialsField.recipientIndex,
      fieldMeta: {
        label: 'Initial Date',
        required: true
      }
    };

    // Add the field to the array
    setFields([...fields, initialDateField]);
    setActiveFieldId(initialDateField.formId);
  };

  // Add recipient
  const addRecipient = (recipient: Recipient) => {
    setRecipients([...recipients, recipient]);
    // Auto-select first recipient
    if (recipients.length === 0) {
      setSelectedRecipient(recipient.id);
    }
  };

  // Helper to get ordinal name for new recipients
  const getOrdinalName = (index: number): string => {
    if (index === 0) return 'Host';
    if (index === 1) return 'Primary Renter';
    const v = index;
    const suffix = ['th', 'st', 'nd', 'rd'];
    const ordinalNum = v - 1; // Convert to 1-indexed for display
    return ordinalNum + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]) + ' Renter';
  };

  // Handle adding a new recipient (for mobile UI)
  const handleAddRecipient = () => {
    const newIndex = recipients.length;
    const newRecipient: Recipient = {
      id: `recipient-${Date.now()}`,
      name: getOrdinalName(newIndex),
      email: `renter-${newIndex}@template.placeholder`,
      color: getRecipientColor(newIndex),
      role: 'RENTER'
    };
    setRecipients([...recipients, newRecipient]);
    setSelectedRecipient(newRecipient.id);
  };

  // Remove recipient
  const removeRecipient = (id: string) => {
    const recipientIndex = recipients.findIndex(r => r.id === id);
    setRecipients(recipients.filter(r => r.id !== id));
    // Remove all fields for this recipient
    const fieldsToRemove = fields.filter(field => field.recipientIndex === recipientIndex);
    setFields(fields.filter(field => field.recipientIndex !== recipientIndex));
    if (selectedRecipient === id) {
      setSelectedRecipient(recipients.length > 1 ? recipients.find(r => r.id !== id)?.id || null : null);
    }
  };

  // Export functionality
  const exportPDF = async () => {
    if (!pdfFile) return;

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const { exportPDFWithFields, downloadBlob } = await import('@/lib/pdfExporter');

      const exportedPdfBytes = await exportPDFWithFields(
        arrayBuffer,
        fields,
        recipients,
        signedFields, // Pass the signed values
        {
          showFieldBorders: workflow.isTemplatePhase() || workflow.isDocumentPhase(), // Show borders during editing
          includeLabels: true,
          fieldOpacity: (workflow.isTemplatePhase() || workflow.isDocumentPhase()) ? 0.3 : 1.0, // Show fields during editing
        }
      );

      const blob = new Blob([exportedPdfBytes], { type: 'application/pdf' });
      const suffix = legacyWorkflowState === 'completed' ? '_SIGNED' : '_with_fields';
      const filename = `${pdfFile.name.replace('.pdf', '')}${suffix}.pdf`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  // Step 1 → Step 2: Save template and create document
  const saveTemplateAndCreateDocument = async (onSaveCallback?: () => void) => {
    const result = await saveTemplateService({
      pdfFile: pdfFile!,
      fields,
      recipients,
      templateName,
      templateType,
      listingId,
      router,
      sessionStorage,
      brandAlert,
      onSaveCallback
    });

    if (result.success) {
      setWorkflowState('selection');
      setSelectedField(null);
      setActiveFieldId(null);
    }
  };

  // Step 2 → Step 3: Save document and start signing workflow
  const saveDocumentAndStartSigning = async () => {
    const result = await saveDocumentAndStartSigningService({
      isMergedDocument,
      mergedTemplateIds,
      fields,
      recipients,
      signedFields,
      pageWidth,
      sessionStorage,
      brandAlert,
      workflowDispatch: workflow.dispatch
    });

    if (result.success) {
      // Clear any selection states
      setSelectedField(null);
      setActiveFieldId(null);
    }
  };

  // Save signer progress for async workflow (doesn't auto-transition)
  const saveSignerProgressAsync = async (signerIndex: number) => {
    const documentId = sessionStorage.getItem('currentDocumentId');
    if (!documentId) {
      brandAlert('Document not found. Please start over.', 'error', 'Document Not Found');
      return;
    }

    const result = await saveSignerProgressAsyncService({
      signerIndex,
      documentId,
      fields,
      recipients,
      signedFields,
      pageWidth,
      brandAlert,
      useSignedFieldsStore
    });

    if (result.success) {
      // Return to selection screen for async workflow
      setWorkflowState('selection');

      // Reset validation state
      setFieldsRendered(false);
      setRenderingStatus('pending');
    } else {
      throw new Error(result.error || 'Failed to save signer progress');
    }
  };

  // Step 3/4 → Next: Save signer progress (legacy synchronous version)
  const saveSignerProgressAndContinue = async (signerIndex: number) => {
    const documentId = sessionStorage.getItem('currentDocumentId');
    if (!documentId) {
      brandAlert('Document not found. Please start over.', 'error', 'Document Not Found');
      return;
    }

    await saveSignerProgressAndContinueService({
      signerIndex,
      documentId,
      fields,
      recipients,
      brandAlert,
      useSignedFieldsStore,
      completeSigning,
      setWorkflowState
    });
  };

  // Complete signing workflow
  const completeSigning = async () => {
    const documentId = sessionStorage.getItem('currentDocumentId');
    if (!documentId) {
      brandAlert('Document not found. Please start over.', 'error', 'Document Not Found');
      return;
    }

    try {
      // Update document to completed status
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          currentStep: 'completed',
          completedAt: new Date().toISOString()
        }),
      });

      setWorkflowState('selection');

    } catch (error) {
      console.error('Error in completeSigning:', error);
      brandAlert('Failed to complete signing. Please try again.', 'error', 'Signing Failed');
    }
  };

  // Save template functionality (manual save)
  const saveTemplate = async (onSaveCallback?: () => void) => {
    await saveTemplateAndCreateDocument(onSaveCallback);
  };

  // Save document functionality (manual save without starting signing)
  const saveDocument = async () => {
    await saveDocumentService({
      isMergedDocument,
      mergedTemplateIds,
      fields,
      recipients,
      signedFields,
      pageWidth,
      sessionStorage,
      brandAlert
    });
  };

  // Trip configuration handlers
  const handleTripConfiguration = (matchDetails: MatchDetails) => {
    setTripMatchDetails(matchDetails);
    setShowTripConfiguration(false);
    // Pre-population will be triggered by useEffect when pages are ready
  };

  const goBackToTemplate = () => {
    if (workflow.isDocumentPhase()) {
      setShowTripConfiguration(true);
      setPdfFile(null);
      setFields([]);
      setPdfPagesReady(false);
      setPageElements(new Map());
    }
  };

  const toggleAccordion = (section: keyof typeof accordionStates) => {
    setAccordionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Render default sidebar content
  const renderDefaultSidebarContent = () => {
    return (
      <>
        {/* Template editing interface */}
        {workflow.isTemplatePhase() && (
          <TemplateSidebar
            recipients={recipients}
            setRecipients={setRecipients}
            selectedRecipient={selectedRecipient}
            setSelectedRecipient={setSelectedRecipient}
            selectedField={selectedField}
            setSelectedField={setSelectedField}
            setInteractionMode={setInteractionMode}
            startFieldDetection={startFieldDetection}
            accordionStates={accordionStates}
            toggleAccordion={toggleAccordion}
          />
        )}

        {/* Document creation interface */}
        {workflow.isDocumentPhase() && (
          <TemplateSidebar
            recipients={recipients}
            setRecipients={setRecipients}
            selectedRecipient={selectedRecipient}
            setSelectedRecipient={setSelectedRecipient}
            selectedField={selectedField}
            setSelectedField={setSelectedField}
            setInteractionMode={setInteractionMode}
            startFieldDetection={startFieldDetection}
            accordionStates={accordionStates}
            toggleAccordion={toggleAccordion}
          />
        )}

        {/* Default signing interface for signer2 */}
        {(workflow.isSigningPhase() && !workflow.isFirstSigner()) && (
          <SigningSidebar
            getCurrentSigner={getCurrentSigner}
            fields={fields}
            signedFieldsStore={useSignedFieldsStore}
          />
        )}
      </>
    );
  };

  // Load template functionality
  const loadTemplate = async (template: PdfTemplate) => {
    const result = await loadTemplateService({
      template,
      hostName,
      hostEmail,
      sessionStorage,
      brandAlert
    });

    if (result.success && result.fields && result.recipients) {
      setFields(result.fields);
      setRecipients(result.recipients);
      if (result.pdfFile) {
        setPdfFile(result.pdfFile);
      }

      // Set to document mode instead of template mode for editing with real data
      setWorkflowState('document');

      // Pre-fill fields based on the result (handle asynchronously)
      if (result.preFilledFields) {
        setTimeout(() => {
          // Parent component should handle this via props or store
        }, 100);
      }
    }
  };

  // Load document functionality for signing
  const loadDocumentForSigning = async (document: any) => {
    const result = await loadDocumentForSigningService({
      document,
      sessionStorage,
      brandAlert
    });

    if (result.success && result.fields && result.recipients) {
      setFields(result.fields);
      setRecipients(result.recipients);
      if (result.pdfFile) {
        setPdfFile(result.pdfFile);
      }

      // Set to the appropriate signer state
      if (pendingSignerType) {
        setWorkflowState(pendingSignerType);
        setPendingSignerType(null);
      }

      // Close the document selector
      setShowDocumentSelector(false);

      // Handle existing signed fields if needed
      if (result.existingSignedFields) {
      }
    }
  };

  // Create document and transition to signing
  const createDocumentAndStartSigning = async () => {
    const result = await createDocumentAndStartSigningService({
      pdfFile,
      isMergedDocument,
      fields,
      recipients,
      signedFields,
      pageWidth,
      sessionStorage,
      workflowDispatch: workflow.dispatch
    });

    if (result.success) {
      setIsCreatingDocument(false);
    }
  };

  // Validate signature fields
  const validateSignatureFields = () => {
    const hostSignature = fields.find(f =>
      f.type === FieldType.SIGNATURE && f.recipientIndex === 0
    );
    const renterSignature = fields.find(f =>
      f.type === FieldType.SIGNATURE && f.recipientIndex === 1
    );

    return {
      hasHostSignature: !!hostSignature,
      hasRenterSignature: !!renterSignature,
      isValid: !!hostSignature && !!renterSignature
    };
  };

  // Handle field validation modal actions
  const handleFieldValidationEdit = () => {
    setShowFieldValidationModal(false);
    // Switch to primary renter (recipient index 1)
    const primaryRenter = recipients.find(r => r.recipientIndex === 1);
    if (primaryRenter) {
      setSelectedRecipient(primaryRenter.id);
    }
  };

  const handleFieldValidationProceed = async () => {
    setShowFieldValidationModal(false);
    // Continue with the original flow
    await proceedWithTemplateCompletion();
  };

  // Extracted template completion logic
  const proceedWithTemplateCompletion = async () => {
    setIsSavingTemplate(true);
    try {
      await saveTemplateAndCreateDocument(() => {
        setIsSavingTemplate(false);
      });
    } catch (error) {
      setIsSavingTemplate(false);
      console.error('Error completing template:', error);
    }
  };

  // Step completion handler using custom hook
  const { completeCurrentStep } = useStepCompletion({
    workflow,
    legacyWorkflowState,
    pdfFile,
    fields,
    recipients,
    templateType,
    housingRequestId,
    signedFields,
    setIsSavingTemplate,
    setIsCreatingDocument,
    setStepCompleted,
    setShowFieldValidationModal,
    brandAlert,
    validateSignatureFields,
    proceedWithTemplateCompletion,
    onSave,
    onDocumentCreated,
    createDocumentAndStartSigning,
    saveSignerProgressAsync,
    onFinish
  });

  // Expose complete step function to parent component using ref approach to avoid loops
  const onCompleteStepReadyRef = useRef(onCompleteStepReady);
  onCompleteStepReadyRef.current = onCompleteStepReady;

  useEffect(() => {
    if (onCompleteStepReadyRef.current && (workflow.isDocumentPhase() || (workflow.isSigningPhase() && workflow.isFirstSigner()))) {
      onCompleteStepReadyRef.current(completeCurrentStep);
    }
  }, [legacyWorkflowState]);

  // Expose signing action function to parent component during signing states
  const onSigningActionReadyRef = useRef(onSigningActionReady);
  onSigningActionReadyRef.current = onSigningActionReady;

  useEffect(() => {
    if (onSigningActionReadyRef.current && workflow.isSigningPhase()) {
      onSigningActionReadyRef.current(handleSigningAction);
    }
  }, [legacyWorkflowState]);

  // Navigation functions removed - components are now isolated

  // Get current signer for signing workflow
  const getCurrentSigner = () => {
    if (!workflow.isSigningPhase()) return null;
    return recipients[workflow.getCurrentSignerIndex()];
  };

  // Note: getFieldLabel is now imported from @/utils/fieldLabelUtils

  // Get unsigned fields for current signer - wrapper around utility function
  const getUnsignedFields = (currentSignedFields: Record<string, any>) => {
    return getUnsignedFieldsUtil({
      fields,
      currentSignerIndex: workflow.getCurrentSignerIndex(),
      currentSignedFields
    });
  };

  // Navigate to specific field and flash it - wrapper around utility function
  const navigateToField = (fieldId: string) => {
    navigateToFieldUtil({
      fieldId,
      fields,
      recipients,
      signedFields: useSignedFieldsStore.getState().signedFields,
      legacyWorkflowState
    });
  };

  // Navigate to next unsigned field and flash it - wrapper around utility function
  const navigateToNextField = () => {
    const currentSignedFields = useSignedFieldsStore.getState().signedFields;
    const unsignedFields = getUnsignedFields(currentSignedFields);

    if (unsignedFields.length === 0) {
      return;
    }

    const nextField = unsignedFields[0];
    navigateToNextFieldUtil({ nextField });
  };

  // Handle signing button click - using Zustand store directly
  const handleSigningAction = async () => {
    const currentSignedFields = useSignedFieldsStore.getState().signedFields;
    const unsignedFields = getUnsignedFields(currentSignedFields);

    if (unsignedFields.length > 0) {
      const nextField = unsignedFields[0];

      // Log to server with the unsigned field being selected
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'NEXT ACTION - FIELD SELECTED',
          data: {
            selectedField: {
              formId: nextField.formId,
              type: typeof nextField.type === 'string' ? nextField.type : (nextField.type?.type || nextField.type?.value || ''),
              recipientIndex: nextField.recipientIndex
            },
            allUnsignedFields: unsignedFields.map(f => ({
              formId: f.formId,
              type: typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || ''),
              recipientIndex: f.recipientIndex
            })),
            totalUnsignedCount: unsignedFields.length
          }
        })
      }).catch(console.error);

      // Navigate to next field
      navigateToNextField();
    } else {
      // All fields signed, complete the step
      await completeCurrentStep();
    }
  };

  // Signature management functions
  const fetchSavedSignatures = async () => {
    setIsLoadingSignatures(true);
    try {
      const response = await fetch('/api/signatures');
      if (response.ok) {
        const signatures = await response.json();
        setSavedSignatures(signatures);
      } else {
        console.error('Failed to fetch signatures');
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
    } finally {
      setIsLoadingSignatures(false);
    }
  };

  // User initials save handler
  const saveUserInitials = async (initials: string) => {
    try {
      await updateUserInitials(initials);

      // Update client-side state immediately so dialog won't show again this session
      setCurrentUserInitials(initials);
    } catch (error) {
      console.error('💾 PDFEditor - Error saving user initials:', error);
      throw error;
    }
  };

  const saveSignature = async (type: 'drawn' | 'typed', data: string, fontFamily?: string, setAsDefault?: boolean) => {
    try {
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          fontFamily,
          setAsDefault
        }),
      });

      if (response.ok) {
        const newSignature = await response.json();
        setSavedSignatures(prev => [newSignature, ...prev]);
      } else {
        console.error('Failed to save signature');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  const deleteSignature = async (signatureId: string) => {
    try {
      const response = await fetch(`/api/signatures/${signatureId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedSignatures(prev => prev.filter(sig => sig.id !== signatureId));
      } else {
        console.error('Failed to delete signature');
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
    }
  };

  const setDefaultSignature = async (signatureId: string) => {
    try {
      const response = await fetch(`/api/signatures/${signatureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        const updatedSignature = await response.json();
        setSavedSignatures(prev =>
          prev.map(sig => ({
            ...sig,
            isDefault: sig.id === signatureId
          }))
        );
      } else {
        console.error('Failed to set default signature');
      }
    } catch (error) {
      console.error('Error setting default signature:', error);
    }
  };

  // Fetch saved signatures when component mounts or when transitioning to signing
  useEffect(() => {
    if (workflow.isSigningPhase()) {
      fetchSavedSignatures();
    }
  }, [legacyWorkflowState]);

  // Handle field signing/filling
  const signField = (fieldId: string, value: any) => {
    const field = fields.find(f => f.formId === fieldId);

    // Check if this is a signature/initial field being signed
    if (field && ['SIGNATURE', 'INITIALS'].includes(field.type)) {
      // Log to server with field and all fields array
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'FIELD SIGNED',
          data: {
            signedField: {
              formId: fieldId,
              type: field.type,
              recipientIndex: field.recipientIndex,
              wasAlreadySigned: !!useSignedFieldsStore.getState().signedFields[fieldId]
            },
            allFields: fields.map(f => ({
              formId: f.formId,
              type: typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || ''),
              recipientIndex: f.recipientIndex,
              isSigned: f.formId === fieldId ? true : !!useSignedFieldsStore.getState().signedFields[f.formId] // Account for the field being signed right now
            }))
          }
        })
      }).catch(console.error);
    }

    // Update the field in context
    setSignedField(fieldId, value);

    // Also notify parent component if callback exists (for backward compatibility)
    if (onFieldSign) {
      onFieldSign(fieldId, value);
    }

    // Sign dates and initial dates will be filled during the actual lease signing process
    // Do not auto-populate these fields here
  };

  // Start field placement with movement detection
  const startFieldDetection = (fieldType: FieldType, recipientId: string, mouseEvent: MouseEvent, label?: string) => {
    setSelectedField(fieldType);
    setSelectedRecipient(recipientId);
    if (label) setPendingFieldLabel(label);
    setInteractionMode('detecting');
    setIsMouseDown(true);
    setMouseDownPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
  };

  // Legacy function for backward compatibility
  const startFieldPlacement = (fieldType: FieldType, recipientId: string, label?: string) => {
    setSelectedField(fieldType);
    setSelectedRecipient(recipientId);
    if (label) setPendingFieldLabel(label);
    setIsDragging(true);
    setInteractionMode('click-to-place');
  };

  // Mobile touch-friendly field placement (no MouseEvent required)
  const startMobileFieldPlacement = (fieldType: FieldType, label?: string) => {
    if (!selectedRecipient) return;
    setSelectedField(fieldType);
    if (label) setPendingFieldLabel(label);
    setIsDragging(true);
    setInteractionMode('click-to-place');
    setIsMobileDrawerOpen(false);
  };

  // Cancel field placement
  const cancelFieldPlacement = () => {
    setSelectedField(null);
    setPendingFieldLabel(null);
    setIsDragging(false);
    setInteractionMode('idle');
    setIsMouseDown(false);
    setMouseDownPosition({ x: 0, y: 0 });
  };

  // Custom field dialog handlers - simplified to avoid infinite loops
  const handleCustomFieldSave = (fieldMeta: FieldMeta) => {
    const currentField = customFieldDialog.field;
    if (!currentField) return;

    const updatedField = {
      ...currentField,
      fieldMeta: { ...currentField.fieldMeta, ...fieldMeta }
    };

    // Add field to fields array using functional update
    setFields(prevFields => [...prevFields, updatedField]);
    setActiveFieldId(updatedField.formId);

    // Close dialog
    setCustomFieldDialog({ isOpen: false, field: null });
  };

  const handleCustomFieldCancel = () => {
    setCustomFieldDialog({ isOpen: false, field: null });
  };

  // Handle clicking on a field to configure it or edit its value
  const handleFieldClick = (field: FieldFormType) => {
    // In template mode, configure field settings
    if (workflow.isTemplatePhase()) {
      // Only open modal for configurable field types
      const configurableTypes = [FieldType.TEXT, FieldType.NUMBER, FieldType.EMAIL, FieldType.NAME, FieldType.DATE];
      if (!configurableTypes.includes(field.type as FieldType)) return;

      setTextFieldConfigModal({ isOpen: true, field });
      setActiveFieldId(field.formId);
    }
    // In document mode, edit field values
    else if (workflow.isDocumentPhase()) {
      // Don't allow editing signature/initials fields - those are handled during signing
      if (field.type === FieldType.SIGNATURE || field.type === FieldType.INITIALS) return;

      setFieldValueEditModal({ isOpen: true, field });
      setActiveFieldId(field.formId);
    }
  };

  // Handle saving text field configuration
  const handleTextFieldConfigSave = (fieldId: string, fieldMeta: FieldMeta) => {
    setFields(fields.map(f =>
      f.formId === fieldId
        ? { ...f, fieldMeta: { ...f.fieldMeta, ...fieldMeta } }
        : f
    ));
    setTextFieldConfigModal({ isOpen: false, field: null });
  };

  // Handle saving field value in document mode
  const handleFieldValueSave = (fieldId: string, value: any) => {
    setSignedField(fieldId, value);
    setFieldValueEditModal({ isOpen: false, field: null });
  };

  // Handle closing text field configuration modal
  const handleTextFieldConfigClose = () => {
    setTextFieldConfigModal({ isOpen: false, field: null });
  };

  // Validate that field components are actually rendered in the DOM
  const validateFieldRendering = useCallback(async () => {
    if (fields.length === 0) {
      setRenderingStatus('pending');
      setFieldsRendered(false);
      return;
    }

    setRenderingStatus('checking');

    // Wait a short time for React to finish rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    let renderedCount = 0;
    let totalFields = fields.length;

    for (const field of fields) {
      // Look for the field element in the DOM using data attributes
      const fieldElement = document.querySelector(`[data-field-id="${field.formId}"]`);

      if (fieldElement) {
        // Check if the element is actually visible and positioned
        const rect = fieldElement.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && rect.top >= 0;

        if (isVisible) {
          renderedCount++;
        }
      }
    }

    const allRendered = renderedCount === totalFields;

    if (allRendered) {
      setRenderingStatus('rendered');
      setFieldsRendered(true);
    } else {
      setRenderingStatus('failed');
      setFieldsRendered(false);
    }

    return allRendered;
  }, [fields]);

  // Auto-validate rendering when fields change
  useEffect(() => {
    if (fields.length > 0 && workflow.isSigningPhase()) {
      // Delay validation to allow PDF and fields to fully load
      const timeoutId = setTimeout(() => {
        validateFieldRendering();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [fields, legacyWorkflowState, validateFieldRendering]);


  if (!pdfFile && workflow.isTemplatePhase()) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Template</h2>
            </div>
            <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <div>
                  <p className="text-lg font-medium text-blue-600 mb-2">Drop the PDF here</p>
                  <p className="text-sm text-gray-500">Release to upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">Upload PDF Document</p>
                  <p className="text-sm text-gray-500 mb-4">Drag & drop a PDF here, or click to select</p>
                  <Button variant="outline">
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedRecipientData = recipients.find(r => r.id === selectedRecipient);

  // Success screen removed - now handled by toast + redirect in useStepCompletion

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      {/* Ghost cursor for field placement - rendered via portal-like fixed positioning */}
      {selectedField && (interactionMode === 'dragging' || interactionMode === 'click-to-place') && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: coords.x,
            top: coords.y,
            width: fieldBounds.current.width,
            height: fieldBounds.current.height,
            backgroundColor: isFieldWithinBounds ? '#3B82F6' : '#EF4444',
            border: interactionMode === 'dragging' ? '2px solid white' : '2px dashed white',
            borderRadius: '4px',
            opacity: interactionMode === 'dragging' ? 0.7 : 0.5,
          }}
        />
      )}

      {/* Main content area with sidebar and editor */}
      <div ref={pdfEditorContainerRef} className={`flex flex-1 min-h-0 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Sidebar - responsive layout - conditionally rendered (hidden on mobile in template/document phases) */}
        {!hideDefaultSidebar && !(isMobile && (workflow.isTemplatePhase() || workflow.isDocumentPhase())) && (
          <div className={`${
            isMobile
              ? 'w-full bg-[#e7f0f0] border-b border-gray-200 overflow-y-visible'
              : 'w-96 bg-[#e7f0f0] border-r border-gray-200 overflow-y-auto overflow-x-hidden max-h-screen'
          }`}>
            <div className="p-4">
              {/* Use custom sidebar content if provided, otherwise use default */}
              {customSidebarContent ? (
                customSidebarContent(legacyWorkflowState, renderDefaultSidebarContent())
              ) : (
                renderDefaultSidebarContent()
              )}
            </div>
          </div>
        )}

        {/* Main Editor */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* PDF Viewer */}
          <div className="flex-1 px-6">
            {/* Header for template creation */}
            {workflow.isTemplatePhase() && listingAddress && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900">
                  Create {templateType === 'lease' ? 'Lease' : 'Addendum'} Template for {listingAddress}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Add fields and configure signing requirements for this template
                </p>
              </div>
            )}

            {isMobile ? (
              <MobilePDFWrapper
                isMobile={isMobile}
                isPlacementMode={!!selectedField && interactionMode === 'click-to-place'}
              >
                <PDFViewer
                  file={pdfFile}
                  onPageClick={handlePageClick}
                  pageWidth={pageWidth}
                  isFieldPlacementMode={!!selectedField && (interactionMode === 'dragging' || interactionMode === 'click-to-place')}
                >
                  {/* Helper function to determine if a field should be shown for renter (signer2) */}
                  {fields.filter((field) => {
                // For signer2 (renter), filter fields to show only what's needed
                if (workflow.isSigningPhase() && !workflow.isFirstSigner()) {
                  const signedFields = useSignedFieldsStore.getState().signedFields;

                  // If it's the host's field (index 0), only show if it's already signed
                  if (field.recipientIndex === 0) {
                    return !!signedFields[field.formId];
                  }
                  // If it's the renter's field (index 1), only show signature/initial fields
                  if (field.recipientIndex === 1) {
                    const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                    return fieldType === 'SIGNATURE' || fieldType === 'INITIALS';
                  }
                  // Don't show fields for other recipients
                  return false;
                }
                // For all other workflow states, show all fields
                return true;
              }).map((field) => {
                const pageElement = pageElements.get(field.pageNumber);
                // Find recipient by signerEmail first, then fall back to recipientIndex
                let recipient = recipients.find(r => r.id === field.signerEmail);
                if (!recipient && field.recipientIndex !== undefined) {
                  recipient = recipients.find(r => r.id === `recipient_${field.recipientIndex}`) || recipients[field.recipientIndex];
                }

                // Skip rendering if pages aren't ready yet
                if (!pdfPagesReady || !pageElement) {
                  return null;
                }

                // During template or document editing, show draggable fields
                if (workflow.isTemplatePhase() || workflow.isDocumentPhase()) {
                  return (
                    <FieldItem
                      key={field.formId}
                      field={field}
                      recipient={recipient}
                      onMove={updateField}
                      onResize={updateField}
                      onRemove={removeField}
                      onAddSignDate={handleAddSignDate}
                      onAddInitialDate={handleAddInitialDate}
                      onFieldClick={handleFieldClick}
                      active={field.formId === activeFieldId}
                      pageElement={pageElement}
                      signedValue={useSignedFieldsStore.getState().signedFields[field.formId]}
                      showValues={workflow.isDocumentPhase()} // Show values in document mode
                    />
                  );
                }

                // During signing, show signable fields
                if (workflow.isSigningPhase()) {
                  const currentSignerIndex = workflow.getCurrentSignerIndex();
                  return (
                    <SignableField
                      key={field.formId}
                      field={field}
                      recipient={recipient}
                      onSign={signField}
                      isSigned={!!useSignedFieldsStore.getState().signedFields[field.formId]}
                      signedValue={useSignedFieldsStore.getState().signedFields[field.formId]}
                      isForCurrentSigner={field.recipientIndex === currentSignerIndex}
                      pageElement={pageElement}
                      savedSignatures={savedSignatures}
                      onSaveSignature={saveSignature}
                      onDeleteSignature={deleteSignature}
                      onSetDefaultSignature={setDefaultSignature}
                      currentInitials={currentUserInitials}
                      onSaveInitials={saveUserInitials}
                    />
                  );
                }

                // During completion, show read-only signed fields (success phase only)
                if (workflow.isSuccessPhase()) {
                  return (
                    <SignableField
                      key={field.formId}
                      field={field}
                      recipient={recipient}
                      onSign={() => { }} // No signing allowed
                      isSigned={!!useSignedFieldsStore.getState().signedFields[field.formId]}
                      signedValue={useSignedFieldsStore.getState().signedFields[field.formId]}
                      isForCurrentSigner={false}
                      pageElement={pageElement}
                      savedSignatures={savedSignatures}
                      onSaveSignature={saveSignature}
                      onDeleteSignature={deleteSignature}
                      onSetDefaultSignature={setDefaultSignature}
                      currentInitials={currentUserInitials}
                      onSaveInitials={saveUserInitials}
                    />
                  );
                }

                // Unexpected phase - log error and return null
                console.error('⚠️ PDFEditor - Unexpected workflow phase for field rendering:', {
                  fieldId: field.formId,
                  currentPhase: workflow.state.phase,
                  isTemplatePhase: workflow.isTemplatePhase(),
                  isDocumentPhase: workflow.isDocumentPhase(),
                  isSigningPhase: workflow.isSigningPhase(),
                  isSuccessPhase: workflow.isSuccessPhase()
                });
                return null;
              })}
                </PDFViewer>
              </MobilePDFWrapper>
            ) : (
              <PDFViewer
                file={pdfFile}
                onPageClick={handlePageClick}
                pageWidth={pageWidth}
                isFieldPlacementMode={!!selectedField && (interactionMode === 'dragging' || interactionMode === 'click-to-place')}
              >
                {/* Helper function to determine if a field should be shown for renter (signer2) */}
                {fields.filter((field) => {
                  // For signer2 (renter), filter fields to show only what's needed
                  if (workflow.isSigningPhase() && !workflow.isFirstSigner()) {
                    const signedFields = useSignedFieldsStore.getState().signedFields;

                    // If it's the host's field (index 0), only show if it's already signed
                    if (field.recipientIndex === 0) {
                      return !!signedFields[field.formId];
                    }
                    // If it's the renter's field (index 1), only show signature/initial fields
                    if (field.recipientIndex === 1) {
                      const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                      return fieldType === 'SIGNATURE' || fieldType === 'INITIALS';
                    }
                    // Don't show fields for other recipients
                    return false;
                  }
                  // For all other workflow states, show all fields
                  return true;
                }).map((field) => {
                  const pageElement = pageElements.get(field.pageNumber);
                  // Find recipient by signerEmail first, then fall back to recipientIndex
                  let recipient = recipients.find(r => r.id === field.signerEmail);
                  if (!recipient && field.recipientIndex !== undefined) {
                    recipient = recipients.find(r => r.id === `recipient_${field.recipientIndex}`) || recipients[field.recipientIndex];
                  }

                  // Skip rendering if pages aren't ready yet
                  if (!pdfPagesReady || !pageElement) {
                    return null;
                  }

                  // For signed values, check both the signed fields store and the initial field values
                  const signedValue = useSignedFieldsStore.getState().signedFields[field.formId] || field.value;

                  // During template or document editing, show draggable fields
                  if (workflow.isTemplatePhase() || workflow.isDocumentPhase()) {
                    return (
                      <FieldItem
                        key={field.formId}
                        field={field}
                        recipient={recipient}
                        onMove={updateField}
                        onResize={updateField}
                        onRemove={removeField}
                        onAddSignDate={handleAddSignDate}
                        onAddInitialDate={handleAddInitialDate}
                        onFieldClick={handleFieldClick}
                        active={field.formId === activeFieldId}
                        pageElement={pageElement}
                        signedValue={signedValue}
                        showValues={workflow.isDocumentPhase()} // Show values in document mode
                      />
                    );
                  }

                  // During signing, show signable fields
                  if (workflow.isSigningPhase()) {
                    const currentSignerIndex = workflow.getCurrentSignerIndex();
                    return (
                      <SignableField
                        key={field.formId}
                        field={field}
                        recipient={recipient}
                        onSign={signField}
                        isSigned={!!signedValue}
                        signedValue={signedValue}
                        isForCurrentSigner={field.recipientIndex === currentSignerIndex}
                        pageElement={pageElement}
                        savedSignatures={savedSignatures}
                        onSaveSignature={saveSignature}
                        onDeleteSignature={deleteSignature}
                        onSetDefaultSignature={setDefaultSignature}
                        currentInitials={currentUserInitials}
                        onSaveInitials={saveUserInitials}
                      />
                    );
                  }

                  // During completion, show read-only signed fields (success phase only)
                  if (workflow.isSuccessPhase()) {
                    return (
                      <SignableField
                        key={field.formId}
                        field={field}
                        recipient={recipient}
                        onSign={() => { }} // No signing allowed
                        isSigned={!!signedValue}
                        signedValue={signedValue}
                        isForCurrentSigner={false}
                        pageElement={pageElement}
                        savedSignatures={savedSignatures}
                        onSaveSignature={saveSignature}
                        onDeleteSignature={deleteSignature}
                        onSetDefaultSignature={setDefaultSignature}
                        currentInitials={currentUserInitials}
                        onSaveInitials={saveUserInitials}
                      />
                    );
                  }

                  // Unexpected phase - log error and return null
                  console.error('⚠️ PDFEditor - Unexpected workflow phase for field rendering:', {
                    fieldId: field.formId,
                    currentPhase: workflow.state.phase,
                    isTemplatePhase: workflow.isTemplatePhase(),
                    isDocumentPhase: workflow.isDocumentPhase(),
                    isSigningPhase: workflow.isSigningPhase(),
                    isSuccessPhase: workflow.isSuccessPhase()
                  });
                  return null;
                })}
              </PDFViewer>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls - Fixed at bottom */}
      {showFooter && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40" style={{ height: '80px' }}>
          <div className="flex items-center justify-between">
            {/* Left side - Status info */}
            <div className="flex items-center gap-4">
              {!isMobile && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{fields.length}</span> fields •
                  <span className="font-medium"> {recipients.length}</span> recipients
                </div>
              )}
              {/* Step indicators removed since components are isolated */}
            </div>

            {/* Right side - Action buttons */}
            {!hideFooterControls && (
              <div className="flex items-center gap-3">
                {/* Template state controls */}
                {workflow.isTemplatePhase() && (
                  <>
                    <BrandButton
                      onClick={completeCurrentStep}
                      disabled={templateType !== 'addendum' && fields.length === 0}
                      size="sm"
                      isLoading={isSavingTemplate}
                    >
                      {(templateType !== 'addendum' && fields.length === 0) ? 'Add Fields First' : 'Finish and Save'}
                    </BrandButton>
                  </>
                )}

                {/* Document setup state controls */}
                {workflow.isDocumentPhase() && (
                  <>
                    <BrandButton
                      onClick={completeCurrentStep}
                      disabled={(templateType !== 'addendum' && fields.length === 0) || isCreatingDocument}
                      size="sm"
                      loading={isCreatingDocument}
                      spinOnClick={true}
                    >
                      {isCreatingDocument
                        ? 'Creating Document...'
                        : (templateType !== 'addendum' && fields.length === 0)
                          ? 'Add Fields First'
                          : 'Create & Sign Document'
                      }
                    </BrandButton>
                  </>
                )}

                {/* Signing state controls */}
                {workflow.isSigningPhase() && (
                  <>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const currentSignerIndex = workflow.getCurrentSignerIndex();

                        // For signer2 (renter), only count SIGNATURE/INITIALS fields (consistent with display filtering)
                        const signerFields = (workflow.isSigningPhase() && !workflow.isFirstSigner())
                          ? fields.filter(f => {
                            // For renter, only count their signature/initial fields
                            if (f.recipientIndex === 1) {
                              const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                              const isSignatureOrInitial = fieldType === 'SIGNATURE' || fieldType === 'INITIALS';
                              return isSignatureOrInitial;
                            }
                            return false;
                          })
                          : fields.filter(f => {
                            return f.recipientIndex === currentSignerIndex;
                          });

                        const signatures = signerFields.filter(f => {
                          const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                          return fieldType === 'SIGNATURE';
                        });
                        const initials = signerFields.filter(f => {
                          const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                          return fieldType === 'INITIALS';
                        });

                        const currentSignedFields = useSignedFieldsStore.getState().signedFields;
                        const pendingSignatures = signatures.filter(f => {
                          const isSigned = !!currentSignedFields[f.formId];
                          return !isSigned;
                        }).length;
                        const pendingInitials = initials.filter(f => {
                          const isSigned = !!currentSignedFields[f.formId];
                          return !isSigned;
                        }).length;

                        const parts = [];
                        if (pendingSignatures > 0) {
                          parts.push(`${pendingSignatures} pending signature${pendingSignatures !== 1 ? 's' : ''}`);
                        }
                        if (pendingInitials > 0) {
                          parts.push(`${pendingInitials} pending initial${pendingInitials !== 1 ? 's' : ''}`);
                        }

                        const finalText = parts.length > 0 ? parts.join(' • ') : 'All fields completed';

                        return finalText;
                      })()}
                    </div>
                    <BrandButton
                      onClick={handleSigningAction}
                      size="sm"
                      spinOnClick={getUnsignedFields(useSignedFieldsStore.getState().signedFields).length === 0}
                    >
                      {getUnsignedFields(useSignedFieldsStore.getState().signedFields).length === 0 ? 'Save and Continue' : 'Next Action'}
                    </BrandButton>
                  </>
                )}

                {/* Completion state controls */}
                {legacyWorkflowState === 'completed' && (
                  <>
                    <Button onClick={exportPDF} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download Signed PDF
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile FAB and Drawer for field selection */}
      {isMobile && (workflow.isTemplatePhase() || workflow.isDocumentPhase()) && (
        <>
          <MobileFieldFAB
            onClick={() => {
              if (selectedField && interactionMode === 'click-to-place') {
                cancelFieldPlacement();
              } else {
                setIsMobileDrawerOpen(true);
              }
            }}
            isPlacingField={!!selectedField && interactionMode === 'click-to-place'}
            showFooter={showFooter}
          />

          <MobileFieldDrawer
            isOpen={isMobileDrawerOpen}
            onClose={() => setIsMobileDrawerOpen(false)}
            recipients={recipients}
            selectedRecipient={selectedRecipient}
            onRecipientChange={setSelectedRecipient}
            onFieldSelect={startMobileFieldPlacement}
            onAddRecipient={handleAddRecipient}
          />

          {selectedField && interactionMode === 'click-to-place' && (
            <MobilePlacementToast
              fieldType={selectedField}
              recipientName={recipients.find((r) => r.id === selectedRecipient)?.title || recipients.find((r) => r.id === selectedRecipient)?.name || 'Unknown'}
              onCancel={cancelFieldPlacement}
            />
          )}
        </>
      )}

      {/* Template Browser Modal */}
      {showTemplateBrowser && (
        <TemplateBrowser
          onLoadTemplate={loadTemplate}
          onClose={() => setShowTemplateBrowser(false)}
        />
      )}

      {/* Document Selector Modal */}
      {showDocumentSelector && pendingSignerType && (
        <DocumentSelector
          onLoadDocument={loadDocumentForSigning}
          onClose={() => {
            setShowDocumentSelector(false);
            setPendingSignerType(null);
          }}
          signerType={pendingSignerType}
        />
      )}

      {/* Custom Field Configuration Dialog */}
      <CustomFieldDialog
        isOpen={customFieldDialog.isOpen}
        onClose={handleCustomFieldCancel}
        onSave={handleCustomFieldSave}
        fieldType={customFieldDialog.field?.type || FieldType.TEXT}
      />

      {/* Text Field Configuration Modal */}
      <TextFieldConfigModal
        isOpen={textFieldConfigModal.isOpen}
        onClose={handleTextFieldConfigClose}
        field={textFieldConfigModal.field}
        onSave={handleTextFieldConfigSave}
      />

      {/* Field Validation Modal */}
      <FieldValidationModal
        isOpen={showFieldValidationModal}
        onClose={() => setShowFieldValidationModal(false)}
        onEdit={handleFieldValidationEdit}
        onProceed={handleFieldValidationProceed}
        missingHostSignature={!validateSignatureFields().hasHostSignature}
        missingRenterSignature={!validateSignatureFields().hasRenterSignature}
      />

      {/* Field Value Edit Modal (for document mode) */}
      <FieldValueEditModal
        isOpen={fieldValueEditModal.isOpen}
        onClose={() => setFieldValueEditModal({ isOpen: false, field: null })}
        field={fieldValueEditModal.field}
        onSave={handleFieldValueSave}
      />

    </div>
  );
};

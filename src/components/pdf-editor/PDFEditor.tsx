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
import { TemplateBrowser } from './TemplateBrowser';
import { DocumentTemplateSelector } from './DocumentTemplateSelector';
import { DocumentSelector } from './DocumentSelector';
import { TripConfiguration } from './TripConfiguration';
import { CustomFieldDialog } from './CustomFieldDialog';
import { RequiredLeaseFields } from './RequiredLeaseFields';
import { FrequentlyUsedFields } from './FrequentlyUsedFields';
import { FieldFormType, FieldType, MatchDetails, FieldMeta, ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING, FRIENDLY_FIELD_TYPE } from './types';
import { createFieldAtPosition, getPage, isWithinPageBounds, getFieldBounds, findBestPositionForSignDate, findBestPositionForInitialDate } from './field-utils';
import { PdfTemplate } from '@prisma/client';
import { handleSignerCompletion } from '@/app/actions/documents';
import { updateUserInitials } from '@/app/actions/user';
import BrandModal from '@/components/BrandModal';
import { useBrandAlert, createBrandAlert, createBrandConfirm } from '@/hooks/useBrandAlert';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';

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

// Workflow states for the signing process
type WorkflowState = 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed';

interface PDFEditorProps {
  initialWorkflowState?: WorkflowState;
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
  hostName?: string;
  hostEmail?: string;
  listingAddress?: string;
  listingId?: string;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
  onFieldSign?: (fieldId: string, value: any) => void;
  onDocumentCreated?: (documentId: string) => void;
  customSidebarContent?: (workflowState: WorkflowState, defaultContent: JSX.Element) => JSX.Element;
  showFooter?: boolean;
  hideFooterControls?: boolean;
  onCompleteStepReady?: (completeStepFn: () => Promise<void>) => void;
  contentHeight?: string;
  signerRole?: 'host' | 'renter';
  onWorkflowStateChange?: (newState: WorkflowState) => void;
  onSigningActionReady?: (signingActionFn: () => Promise<void>) => void;
  // signedFields is now provided by context
  currentUserInitials?: string; // User's saved initials passed from parent
  currentUserName?: string; // User's name for generating initials
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
  currentUserName
}) => {
  const router = useRouter();
  const { showAlert, showConfirm } = useBrandAlert();
  const brandAlert = createBrandAlert(showAlert);
  const brandConfirm = createBrandConfirm(showConfirm);
  const { setSignedField } = useSignedFieldsStore();
  const [pdfFile, setPdfFile] = useState<File | null>(initialPdfFile || null);
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients || []);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [pendingFieldLabel, setPendingFieldLabel] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFieldLabels, setShowFieldLabels] = useState(true);
  const [pageWidth, setPageWidth] = useState(800);
  const [workflowState, setWorkflowStateInternal] = useState<WorkflowState>(initialWorkflowState);
  
  // Wrapper function to handle workflow state changes and notify parent
  const setWorkflowState = (newState: WorkflowState) => {
    setWorkflowStateInternal(newState);
    if (onWorkflowStateChange) {
      onWorkflowStateChange(newState);
    }
  };
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
  
  // Document selector state
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [pendingSignerType, setPendingSignerType] = useState<'signer1' | 'signer2' | null>(null);
  
  // Field validation state
  const [fieldsValidated, setFieldsValidated] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'pending' | 'validating' | 'valid' | 'invalid'>('pending');
  
  // Field rendering validation state
  const [fieldsRendered, setFieldsRendered] = useState(false);
  const [renderingStatus, setRenderingStatus] = useState<'pending' | 'checking' | 'rendered' | 'failed'>('pending');
  
  // Trip configuration state
  const [tripMatchDetails, setTripMatchDetails] = useState<MatchDetails | null>(matchDetails || null);
  const [showTripConfiguration, setShowTripConfiguration] = useState(!matchDetails && workflowState === 'document');
  
  // Document creation loading state
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  
  // Saved signatures state
  const [savedSignatures, setSavedSignatures] = useState<UserSignature[]>([]);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(false);

  // Client-side user initials state (starts with initial value, updates when user saves)
  const [currentUserInitials, setCurrentUserInitials] = useState<string | undefined>(initialUserInitials);

  const [showMissingFieldsDialog, setShowMissingFieldsDialog] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  
  // Accordion states
  const [accordionStates, setAccordionStates] = useState({
    documentInfo: true,
    recipients: true, 
    fieldTypes: true,
    requiredFields: true,
    allFieldTypes: true
  });
  
  // Ghost cursor state for field placement
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const fieldBounds = useRef({ width: 0, height: 0 });
  const pdfEditorContainerRef = useRef<HTMLDivElement>(null);

  // Fields state
  const [fields, setFields] = useState<FieldFormType[]>(initialFields || []);


  // Initialize signedFields with pre-filled values from initialFields
  useEffect(() => {
    if (initialFields && initialFields.length > 0) {
      const preFilledValues: Record<string, any> = {};
      
      initialFields.forEach(field => {
        if (field.value !== undefined && field.value !== null && field.value !== '') {
          preFilledValues[field.formId] = field.value;
          console.log(`📝 Pre-filled field ${field.formId} (${field.type}) with value: "${field.value}" (signer ${field.signerIndex})`);
        }
      });
      
      if (Object.keys(preFilledValues).length > 0) {
        console.log('📝 Pre-filled values found (should be handled by parent):', preFilledValues);
      }
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Movement threshold for detecting drag vs click
  const MOVEMENT_THRESHOLD = 10;

  // Debug: Monitor fields state changes
  useEffect(() => {
    console.log('🔄 Fields state changed:', {
      count: fields.length,
      fields: fields.map(f => ({ id: f.formId, type: f.type, page: f.pageNumber }))
    });
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
    console.log('🔍 PDFEditor - Pre-populating fields with matchDetails:', {
      monthlyPrice: matchDetails.monthlyPrice,
      fieldsToProcess: fields.length
    });

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
    if (tripMatchDetails && fields.length > 0 && workflowState === 'document' && pdfPagesReady) {
      prePopulateFieldsWithMatchDetails(tripMatchDetails);
    }
  }, [tripMatchDetails, fields.length, workflowState, pdfPagesReady, prePopulateFieldsWithMatchDetails]);

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
        console.log('📄 PDF pages ready:', newPageElements.size, 'pages found');
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
      console.warn('⚠️ PDF pages failed to load within timeout');
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
    
    console.log('PDF Editor: Attaching field placement event listeners');

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
        console.log('PDF Editor: Canceling field placement due to outside click');
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
      console.log('PDF Editor: Removed field placement event listeners');
    };
  }, [selectedField, isDragging]);

  // Dual interaction mode detection
  useEffect(() => {
    if (interactionMode === 'idle' || !pdfEditorContainerRef.current) {
      console.log('PDF Editor: Dual interaction mode is idle, no event listeners');
      return;
    }

    const container = pdfEditorContainerRef.current;
    console.log('🎯 Dual interaction effect active:', { interactionMode, isMouseDown, mouseDownPosition });

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (interactionMode === 'detecting' && isMouseDown) {
        const distance = Math.sqrt(
          Math.pow(event.clientX - mouseDownPosition.x, 2) + 
          Math.pow(event.clientY - mouseDownPosition.y, 2)
        );
        
        if (distance > MOVEMENT_THRESHOLD) {
          console.log('🚀 Movement threshold exceeded, entering drag mode');
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
      console.log('🖱️ Global mouse up:', { interactionMode, isMouseDown });
      
      if (interactionMode === 'detecting') {
        console.log('🔄 Transitioning from detecting to click-to-place');
        setInteractionMode('click-to-place');
        setIsDragging(true);
        setIsMouseDown(false);
      } else if (interactionMode === 'dragging') {
        // Find the actual page element under the mouse (works for any page, not just page 1)
        const pdfPageElement = (event.target as Element).closest('[data-pdf-viewer-page]');
        if (pdfPageElement) {
          console.log('✅ MouseUp over PDF page - placing field');
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
          console.log('❌ MouseUp outside PDF - canceling placement');
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

    console.log('PDF Editor: Attaching dual interaction event listeners');
    container.addEventListener('mousemove', handleGlobalMouseMove);
    container.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleGlobalKeyDown); // Keep keyboard on document for global escape

    return () => {
      container.removeEventListener('mousemove', handleGlobalMouseMove);
      container.removeEventListener('mouseup', handleGlobalMouseUp);  
      document.removeEventListener('keydown', handleGlobalKeyDown);
      console.log('PDF Editor: Removed dual interaction event listeners');
    };
  }, [interactionMode, isMouseDown, mouseDownPosition.x, mouseDownPosition.y, MOVEMENT_THRESHOLD, handlePageClick]);

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
    console.log('🎯 handlePageClick called:', {
      selectedField,
      selectedRecipient,
      interactionMode,
      eventPageX: event.pageX,
      eventPageY: event.pageY,
      pageNumber: event.pageNumber
    });

    if (!selectedField || !selectedRecipient || (interactionMode !== 'click-to-place' && interactionMode !== 'dragging' && interactionMode !== 'detecting')) {
      console.log('❌ handlePageClick early return:', {
        hasSelectedField: !!selectedField,
        hasSelectedRecipient: !!selectedRecipient,
        interactionMode,
        validModes: ['click-to-place', 'dragging', 'detecting']
      });
      return;
    }

    // Get field dimensions
    const fieldDimensions = getFieldBounds(selectedField);
    console.log('📏 Field dimensions:', fieldDimensions);
    
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
      console.log('⚠️ Field would not fit, applying best-fit adjustment:', {
        original: { x: event.pageX, y: event.pageY },
        fieldDimensions,
        pageSize: { width: event.pageWidth, height: event.pageHeight }
      });
      
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
      
      console.log('✅ Best-fit adjustment applied:', {
        adjusted: { x: adjustedPageX, y: adjustedPageY },
        adjustedX: adjustedPageX !== event.pageX,
        adjustedY: adjustedPageY !== event.pageY
      });
    }

    // Calculate percentage-based coordinates using adjusted positions
    const pageX = ((adjustedPageX - fieldDimensions.width / 2) / event.pageWidth) * 100;
    const pageY = ((adjustedPageY - fieldDimensions.height / 2) / event.pageHeight) * 100;
    const fieldPageWidth = (fieldDimensions.width / event.pageWidth) * 100;
    const fieldPageHeight = (fieldDimensions.height / event.pageHeight) * 100;

    console.log('🧮 Calculated coordinates:', {
      rawPageX: pageX,
      rawPageY: pageY,
      fieldPageWidth,
      fieldPageHeight
    });

    // Ensure field stays within bounds
    const clampedPageX = Math.max(0, Math.min(pageX, 100 - fieldPageWidth));
    const clampedPageY = Math.max(0, Math.min(pageY, 100 - fieldPageHeight));

    console.log('🗜️ Clamped coordinates:', {
      clampedPageX,
      clampedPageY,
      wasClampedX: clampedPageX !== pageX,
      wasClampedY: clampedPageY !== pageY
    });

    const recipientIndex = recipients.findIndex(r => r.id === selectedRecipient);
    console.log('👤 Recipient info:', {
      selectedRecipient,
      recipientIndex,
      totalRecipients: recipients.length,
      recipients: recipients.map(r => ({ id: r.id, name: r.name }))
    });

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
      // Add specific field label if set from required field buttons
      fieldMeta: pendingFieldLabel ? { label: pendingFieldLabel } : undefined,
    };
    
    console.log('✨ Creating new field:', newField);
    console.log('📝 Current fields before add:', fields.length, fields.map(f => ({ formId: f.formId, type: f.type })));
    
    // Field types that should trigger the custom field dialog
    const customFieldTypes = [FieldType.NAME, FieldType.CHECKBOX, FieldType.DROPDOWN];
    
    console.log('🧹 Cleaning up states:', {
      selectedField: selectedField + ' → null',
      pendingFieldLabel: pendingFieldLabel + ' → null',
      isDragging: 'false',
      interactionMode: interactionMode + ' → idle',
      isMouseDown: 'false'
    });

    // Clean up states first to prevent re-renders
    setSelectedField(null);
    setPendingFieldLabel(null);
    setIsDragging(false);
    setInteractionMode('idle');
    setIsMouseDown(false);
    
    if (customFieldTypes.includes(selectedField) && !pendingFieldLabel) {
      // Only open dialog if NOT from required fields (no pendingFieldLabel)
      setCustomFieldDialog({ isOpen: true, field: newField });
      console.log('⚙️ Opening custom field dialog for:', newField);
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
        console.log('✅ Required field added directly with metadata:', fieldWithMetadata);
        // Log validation status after adding field
        setTimeout(() => logValidationStatus('After Required Field Added'), 0);
      } else {
        // Non-custom fields (signatures, initials, etc.)
        setFields([...fields, newField]);
        setActiveFieldId(newField.formId);
        console.log('✅ Field creation completed, setting states to cleanup');
        // Log validation status after adding field
        setTimeout(() => logValidationStatus('After Non-Custom Field Added'), 0);
      }
    }
    
    console.log('🏁 handlePageClick completed');
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

  // Check if a field is template-enforced (based on the required fields map)
  const isTemplateEnforcedField = (field: FieldFormType) => {
    const requiredFieldMap = {
      'host-signature': { type: FieldType.SIGNATURE, recipientIndex: 0 },
      'host-name': { type: FieldType.NAME, recipientIndex: 0 },
      'renter-signature': { type: FieldType.SIGNATURE, recipientIndex: 1 },
      'renter-name': { type: FieldType.NAME, recipientIndex: 1 },
      'rent-amount': { type: FieldType.NUMBER, label: 'Rent Amount' },
      'move-in-date': { type: FieldType.DATE, label: 'Move In Date' },
      'move-out-date': { type: FieldType.DATE, label: 'Move Out Date' }
    };

    for (const [, config] of Object.entries(requiredFieldMap)) {
      // Check by type, recipient index, and label (for fields with specific labels)
      if (config.recipientIndex !== undefined) {
        if (field.type === config.type && field.recipientIndex === config.recipientIndex) {
          return true;
        }
      } else if (config.label) {
        if (field.type === config.type && field.fieldMeta?.label === config.label) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Check if a field can be removed (template-enforced fields can only be removed if there are duplicates)
  const canRemoveField = (formId: string) => {
    const fieldToRemove = fields.find(f => f.formId === formId);
    if (!fieldToRemove) return false;
    
    // If field is not template-enforced, it can always be removed
    if (!isTemplateEnforcedField(fieldToRemove)) return true;
    
    // If field is template-enforced, check if there are other template-enforced fields of the same type
    const sameTypeEnforcedFields = fields.filter(f => 
      f.formId !== formId && // Don't count the field we're trying to remove
      isTemplateEnforcedField(f) &&
      f.type === fieldToRemove.type && 
      f.recipientIndex === fieldToRemove.recipientIndex &&
      f.fieldMeta?.label === fieldToRemove.fieldMeta?.label
    );
    
    // Can remove if there are other template-enforced fields of this exact type
    return sameTypeEnforcedFields.length > 0;
  };

  // Remove field
  const removeField = (formId: string) => {
    if (!canRemoveField(formId)) {
      console.warn('Cannot remove template-enforced field - it is the last one of its type');
      return;
    }
    
    const fieldToRemove = fields.find(f => f.formId === formId);
    setFields(fields.filter((field) => field.formId !== formId));
    if (activeFieldId === formId) {
      setActiveFieldId(null);
    }
    // Log validation status after removing field
    setTimeout(() => logValidationStatus('After Field Removed'), 0);
  };

  // Add sign date field next to signature field
  const handleAddSignDate = (signatureFieldId: string) => {
    const signatureField = fields.find(f => f.formId === signatureFieldId);
    if (!signatureField || signatureField.type !== FieldType.SIGNATURE) {
      console.warn('Cannot add sign date: signature field not found');
      return;
    }

    // Check if a sign date already exists for this recipient
    const existingSignDate = fields.find(f => 
      f.type === FieldType.SIGN_DATE && 
      f.recipientIndex === signatureField.recipientIndex
    );
    
    if (existingSignDate) {
      console.warn('Sign date field already exists for this recipient');
      return;
    }

    // Get the page element for positioning
    const pageElement = document.querySelector(
      `[data-pdf-viewer-page][data-page-number="${signatureField.pageNumber}"]`
    ) as HTMLElement;
    
    if (!pageElement) {
      console.warn('Cannot find page element for positioning');
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
    setTimeout(() => logValidationStatus('After Sign Date Field Added'), 0);
    
    console.log('✅ Sign date field added:', signDateField);
  };

  // Add initial date field next to initials field
  const handleAddInitialDate = (initialsFieldId: string) => {
    const initialsField = fields.find(f => f.formId === initialsFieldId);
    if (!initialsField || initialsField.type !== FieldType.INITIALS) {
      console.warn('Cannot add initial date: initials field not found');
      return;
    }

    // Check if an initial date already exists for this recipient
    const existingInitialDate = fields.find(f => 
      f.type === FieldType.INITIAL_DATE && 
      f.recipientIndex === initialsField.recipientIndex
    );
    
    if (existingInitialDate) {
      console.warn('Initial date field already exists for this recipient');
      return;
    }

    // Get the page element for positioning
    const pageElement = document.querySelector(
      `[data-pdf-viewer-page][data-page-number="${initialsField.pageNumber}"]`
    ) as HTMLElement;
    
    if (!pageElement) {
      console.warn('Cannot find page element for positioning');
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
    setTimeout(() => logValidationStatus('After Initial Date Field Added'), 0);
    
    console.log('✅ Initial date field added:', initialDateField);
  };

  // Add recipient
  const addRecipient = (recipient: Recipient) => {
    setRecipients([...recipients, recipient]);
    // Auto-select first recipient
    if (recipients.length === 0) {
      setSelectedRecipient(recipient.id);
    }
  };

  // Remove recipient
  const removeRecipient = (id: string) => {
    const recipientIndex = recipients.findIndex(r => r.id === id);
    setRecipients(recipients.filter(r => r.id !== id));
    // Remove all fields for this recipient
    const fieldsToRemove = fields.filter(field => field.recipientIndex === recipientIndex);
    setFields(fields.filter(field => field.recipientIndex !== recipientIndex));
    setTimeout(() => logValidationStatus('After Recipient Removed'), 0);
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
          showFieldBorders: workflowState === 'template' || workflowState === 'document', // Show borders during editing
          includeLabels: true,
          fieldOpacity: (workflowState === 'template' || workflowState === 'document') ? 0.3 : 1.0, // Show fields during editing
        }
      );

      const blob = new Blob([exportedPdfBytes], { type: 'application/pdf' });
      const suffix = workflowState === 'completed' ? '_SIGNED' : '_with_fields';
      const filename = `${pdfFile.name.replace('.pdf', '')}${suffix}.pdf`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  // Step 1 → Step 2: Save template and create document
  const saveTemplateAndCreateDocument = async (onSaveCallback?: () => void) => {
    if (!pdfFile) {
      brandAlert('Please upload a PDF file first.', 'warning', 'File Required');
      return;
    }

    try {
      console.log('🚀 Starting template save process...');
      console.log('📄 PDF File:', {
        name: pdfFile.name,
        size: pdfFile.size,
        type: pdfFile.type
      });
      console.log('🎯 Fields to save:', {
        count: fields.length,
        fields: fields.map(f => ({ id: f.formId, type: f.type, recipientIndex: f.recipientIndex }))
      });
      console.log('👥 Recipients to save:', {
        count: recipients.length,
        recipients: recipients.map(r => ({ id: r.id, name: r.name, email: r.email }))
      });

      // Step 1: Upload PDF file to UploadThing
      console.log('📤 STEP 1: Uploading PDF to UploadThing...');
      const formData = new FormData();
      formData.append('file', pdfFile);

      const uploadResponse = await fetch('/api/pdf-templates/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('📤 Upload response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error(`Upload failed: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();

      // Step 2: Save template with annotations
      const templateData = {
        title: templateName || pdfFile.name.replace('.pdf', ' Template') || 'PDF Template',
        description: `Template created from ${pdfFile.name}`,
        type: templateType,
        listingId,
        fields,
        recipients,
        pdfFileUrl: uploadResult.fileUrl,
        pdfFileName: uploadResult.fileName,
        pdfFileSize: uploadResult.fileSize,
        pdfFileKey: uploadResult.fileKey,
        author: 'PDF Editor User',
        subject: 'PDF Template'
      };

      console.log('💾 Template data being sent:', {
        title: templateData.title,
        fieldsCount: templateData.fields.length,
        recipientsCount: templateData.recipients.length,
        pdfFileUrl: templateData.pdfFileUrl ? 'Present' : 'Missing',
        pdfFileKey: templateData.pdfFileKey ? 'Present' : 'Missing'
      });

      const templateResponse = await fetch('/api/pdf-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      console.log('💾 Template save response status:', templateResponse.status);

      if (!templateResponse.ok) {
        const errorText = await templateResponse.text();
        console.error('❌ Template save failed:', errorText);
        throw new Error(`Template save failed: ${errorText}`);
      }

      const { template } = await templateResponse.json();
      console.log('✅ Template saved successfully:', {
        id: template.id,
        title: template.title,
        createdAt: template.createdAt
      });
      
      // Step 3: Complete and navigate
      console.log('🎉 STEP 3: Finalizing...');
      sessionStorage.setItem('currentTemplateId', template.id);
      console.log('✅ Template ID stored in sessionStorage:', template.id);
      
      // Navigate to success page instead of showing alert
      if (listingId) {
        const successUrl = `/app/host/${listingId}/leases/create/success?templateId=${template.id}&templateName=${encodeURIComponent(template.title)}&templateType=${templateType}&fieldsCount=${fields.length}&recipientsCount=${recipients.length}&pdfFileName=${encodeURIComponent(uploadResult.fileName)}`;
        router.push(successUrl);
      } else {
        // Fallback if no listingId provided
        brandAlert(
          `Template saved successfully!\n\n📄 PDF: ${uploadResult.fileName}\n🎯 Fields: ${fields.length}\n👥 Recipients: ${recipients.length}\n🆔 Template ID: ${template.id}`, 
          'success', 
          'Template Saved',
          onSaveCallback
        );
      }
      
      setWorkflowState('selection');
      setSelectedField(null);
      setActiveFieldId(null);
      
      console.log('🏁 Template save process completed successfully!');
      
    } catch (error) {
      console.error('❌ SAVE TEMPLATE FAILED:', error);
      console.error('❌ Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = '❌ Failed to save template!\n\n';
      if (error.message.includes('Upload failed')) {
        errorMessage += '📤 PDF Upload Error: ' + error.message;
      } else if (error.message.includes('Template save failed')) {
        errorMessage += '💾 Database Save Error: ' + error.message;
      } else {
        errorMessage += '🔧 Unknown Error: ' + error.message;
      }
      
      errorMessage += '\n\n🔍 Check console for detailed logs.';
      brandAlert(errorMessage, 'error', 'Save Failed');
    }
  };

  // Step 2 → Step 3: Save document and start signing workflow  
  const saveDocumentAndStartSigning = async () => {
    try {
      console.log('🚀 Starting saveDocumentAndStartSigning workflow');
      
      let documentId = sessionStorage.getItem('currentDocumentId');
      let templateId = sessionStorage.getItem('currentTemplateId');
      
      // Handle merged document case
      if (isMergedDocument && mergedTemplateIds && !documentId) {
        console.log('📄 Creating new merged document from templates:', mergedTemplateIds);
        
        const createResponse = await fetch('/api/documents/merged', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateIds: mergedTemplateIds,
            documentData: {
              fields,
              recipients,
              metadata: { pageWidth },
              signedFields // Include any pre-filled values
            },
            status: 'IN_PROGRESS', // Start in signing mode
            currentStep: 'signer1'
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create merged document');
        }
        
        const { document } = await createResponse.json();
        documentId = document.id;
        sessionStorage.setItem('currentDocumentId', documentId);
        
        console.log('✅ Merged document created for signing:', documentId);
      }
      // If no document exists yet, create one from the current template
      else if (!documentId && templateId) {
        console.log('📄 No document exists, creating new document from template:', templateId);
        
        const createResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            documentData: {
              fields,
              recipients,
              metadata: { pageWidth },
              signedFields // Include any pre-filled values
            },
            status: 'IN_PROGRESS', // Set status at creation time
            currentStep: 'signer1'
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create document');
        }

        const { document } = await createResponse.json();
        documentId = document.id;
        sessionStorage.setItem('currentDocumentId', documentId);
        console.log('✅ Document created:', documentId);
      }
      
      if (!documentId) {
        brandAlert('Unable to create document. Please start over from template selection.', 'error', 'Document Creation Failed');
        return;
      }

      // Document was created with IN_PROGRESS status, no need to update
      console.log('📝 Document already created with IN_PROGRESS status:', documentId);

      // Create signing sessions for each recipient
      console.log('👥 Creating signing sessions for', recipients.length, 'recipients');
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        await fetch('/api/signing-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId,
            signerIndex: i,
            signerEmail: recipient.email || `${recipient.id}@example.com`,
            signerName: recipient.name
          }),
        });
      }

      // Move to first signer
      setWorkflowState('signer1');
      
      // Clear any selection states
      setSelectedField(null);
      setActiveFieldId(null);
      
      console.log('✅ Document saved and signing workflow started');
      
    } catch (error) {
      console.error('❌ Error in saveDocumentAndStartSigning:', error);
      brandAlert('Failed to start signing workflow: ' + error.message, 'error', 'Signing Failed');
    }
  };

  // Save signer progress for async workflow (doesn't auto-transition)
  const saveSignerProgressAsync = async (signerIndex: number) => {
    const documentId = sessionStorage.getItem('currentDocumentId');
    if (!documentId) {
      brandAlert('Document not found. Please start over.', 'error', 'Document Not Found');
      return;
    }

    console.log(`📋 Saving progress for signer ${signerIndex + 1}, document: ${documentId}`);

    try {
      // Save all signed fields for this signer
      const signerFields = fields.filter(f => f.recipientIndex === signerIndex);
      console.log(`💾 Saving ${signerFields.length} field values for signer ${signerIndex + 1}`);
      
      for (const field of signerFields) {
        const fieldValue = useSignedFieldsStore.getState().signedFields[field.formId];
        if (fieldValue) {
          await fetch('/api/field-values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentId,
              fieldId: field.formId,
              fieldType: field.type,
              signerIndex,
              signerEmail: recipients[signerIndex]?.email || `signer${signerIndex}@example.com`,
              value: fieldValue
            }),
          });
        }
      }

      // Update signing session status
      await fetch('/api/signing-sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          signerIndex
        }),
      });

      // Update document with current progress and signed fields
      console.log(`📄 Updating document status to: ${signerIndex === 0 ? 'IN_PROGRESS' : 'COMPLETED'}`);
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentData: {
            fields,
            recipients,
            metadata: { pageWidth },
            signedFields // Save current signed state
          },
          currentStep: signerIndex === 0 ? 'signer2' : 'completed',
          status: signerIndex === 0 ? 'IN_PROGRESS' : 'COMPLETED',
          [`signer${signerIndex + 1}CompletedAt`]: new Date().toISOString()
        }),
      });
      
      console.log('✅ Document updated successfully');

      // Show success and return to selection
      const signerName = recipients[signerIndex]?.name || `Signer ${signerIndex + 1}`;
      brandAlert(`${signerName} has completed signing!\n\n${signerIndex === 0 ? 'Document is now ready for Signer 2.' : 'Document is fully signed and complete.'}`, 'success', 'Signing Complete');
      
      // Return to selection screen for async workflow
      setWorkflowState('selection');
      
      // Reset validation state
      setFieldsValidated(false);
      setValidationStatus('pending');
      setFieldsRendered(false);
      setRenderingStatus('pending');
      
      console.log(`Signer ${signerIndex + 1} completed signing asynchronously`);
      
    } catch (error) {
      console.error('Error in saveSignerProgressAsync:', error);
      brandAlert('Failed to save signer progress. Please try again.', 'error', 'Save Failed');
    }
  };

  // Step 3/4 → Next: Save signer progress (legacy synchronous version)
  const saveSignerProgressAndContinue = async (signerIndex: number) => {
    const documentId = sessionStorage.getItem('currentDocumentId');
    if (!documentId) {
      brandAlert('Document not found. Please start over.', 'error', 'Document Not Found');
      return;
    }

    try {
      // Save all signed fields for this signer
      const signerFields = fields.filter(f => f.recipientIndex === signerIndex);
      
      for (const field of signerFields) {
        const fieldValue = useSignedFieldsStore.getState().signedFields[field.formId];
        if (fieldValue) {
          await fetch('/api/field-values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentId,
              fieldId: field.formId,
              fieldType: field.type,
              signerIndex,
              signerEmail: recipients[signerIndex]?.email || `signer${signerIndex}@example.com`,
              value: fieldValue
            }),
          });
        }
      }

      // Update signing session status
      await fetch('/api/signing-sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          signerIndex
        }),
      });

      // Move to next step
      if (signerIndex === 0) {
        // Moving from signer1 (recipientIndex 0) to signer2
        await fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStep: 'signer2'
          }),
        });
        setWorkflowState('signer2');
      } else {
        // All signers complete
        await completeSigning();
      }
      
    } catch (error) {
      console.error('Error in saveSignerProgressAndContinue:', error);
      brandAlert('Failed to save signer progress. Please try again.', 'error', 'Save Failed');
    }
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
      
      console.log('Document signing completed');
      
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
    try {
      console.log('🚀 Starting saveDocument workflow');
      
      let documentId = sessionStorage.getItem('currentDocumentId');
      let templateId = sessionStorage.getItem('currentTemplateId');
      
      // Handle merged document case
      if (isMergedDocument && mergedTemplateIds && !documentId) {
        console.log('📄 Creating new merged document from templates:', mergedTemplateIds);
        
        const createResponse = await fetch('/api/documents/merged', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateIds: mergedTemplateIds,
            documentData: {
              fields,
              recipients,
              metadata: { pageWidth },
              signedFields // Include any pre-filled values
            },
            status: 'DRAFT',
            currentStep: 'document'
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create merged document');
        }
        
        const { document } = await createResponse.json();
        documentId = document.id;
        sessionStorage.setItem('currentDocumentId', documentId);
        
        console.log('✅ Merged document created:', documentId);
      }
      // If no document exists yet, create one from the current template
      else if (!documentId && templateId) {
        console.log('📄 No document exists, creating new document from template:', templateId);
        
        const createResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            documentData: {
              fields,
              recipients,
              metadata: { pageWidth },
              signedFields // Include any pre-filled values
            },
            status: 'DRAFT', // Keep as draft, don't start signing yet
            currentStep: 'document'
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create document');
        }

        const { document } = await createResponse.json();
        documentId = document.id;
        sessionStorage.setItem('currentDocumentId', documentId);
        console.log('✅ Document created as draft:', documentId);
        brandAlert('Document saved as draft successfully!', 'success', 'Draft Saved');
      } else if (documentId) {
        // Update existing document
        await fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentData: {
              fields,
              recipients,
              metadata: { pageWidth },
              signedFields
            },
            status: 'DRAFT',
            currentStep: 'document'
          }),
        });
        console.log('✅ Document updated:', documentId);
        brandAlert('Document updated successfully!', 'success', 'Document Updated');
      } else {
        throw new Error('No template or document ID found. Please start from template creation.');
      }
      
    } catch (error) {
      console.error('❌ Error in saveDocument:', error);
      brandAlert('Failed to save document: ' + error.message, 'error', 'Save Failed');
    }
  };

  // Trip configuration handlers
  const handleTripConfiguration = (matchDetails: MatchDetails) => {
    setTripMatchDetails(matchDetails);
    setShowTripConfiguration(false);
    // Pre-population will be triggered by useEffect when pages are ready
  };

  const goBackToTemplate = () => {
    if (workflowState === 'document') {
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
        {workflowState === 'template' && (
          <>
            <RecipientManager 
              recipients={recipients}
              onRecipientsChange={setRecipients}
              selectedRecipient={selectedRecipient}
              onSelectRecipient={setSelectedRecipient}
              accordionState={accordionStates.recipients}
              onToggleAccordion={() => toggleAccordion('recipients')}
            />

            {/* Removed RequiredLeaseFields and FrequentlyUsedFields components */}
            {/* Files: RequiredLeaseFields.tsx and FrequentlyUsedFields.tsx */}
            {/* Can be restored if needed for template-specific field sections */}

            <FieldSelector
              selectedField={selectedField}
              onSelectedFieldChange={(field) => {
                setSelectedField(field);
                setInteractionMode('click-to-place');
              }}
              onStartDrag={(fieldType, mouseEvent, fieldLabel) => {
                // For FieldSelector, we'll use the selected recipient or default to host
                const recipientId = selectedRecipient || 'host-recipient';
                
                // Add labels for specific field types
                let label = fieldLabel; // Use label passed from FieldSelector if provided
                if (!label && fieldType === FieldType.NAME) {
                  if (recipientId === 'host-recipient') {
                    label = 'Host Name';
                  } else if (recipientId === 'primary-renter-recipient') {
                    label = 'Renter Name';
                  }
                }
                if (!label && fieldType === FieldType.EMAIL) {
                  if (recipientId === 'host-recipient') {
                    label = 'Host Email';
                  } else if (recipientId === 'primary-renter-recipient') {
                    label = 'Primary Renter Email';
                  } else {
                    // For additional recipients, find the index
                    const recipientIndex = recipients.findIndex(r => r.id === recipientId);
                    if (recipientIndex > 1) {
                      label = `Renter #${recipientIndex} Email`;
                    }
                  }
                }
                
                startFieldDetection(fieldType, recipientId, mouseEvent, label);
              }}
              accordionState={accordionStates.allFieldTypes}
              onToggleAccordion={() => toggleAccordion('allFieldTypes')}
            />
          </>
        )}

        {/* Document creation interface */}
        {workflowState === 'document' && (
          <>
            {/* Document Information Card */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#3c8787]" />
                  <h3 className="font-medium text-gray-900">Document Information</h3>
                </div>
                
                {tripMatchDetails && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-gray-600">Property Address</div>
                      <div className="font-medium">{tripMatchDetails.propertyAddress}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-gray-600">Monthly Rent</div>
                        <div className="font-medium">${tripMatchDetails.monthlyPrice}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Lease Term</div>
                        <div className="font-medium">{tripMatchDetails.startDate && tripMatchDetails.endDate ? `${new Date(tripMatchDetails.startDate).toLocaleDateString()} - ${new Date(tripMatchDetails.endDate).toLocaleDateString()}` : 'Not set'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recipients Summary */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#3c8787]" />
                  <h3 className="font-medium text-gray-900">Recipients</h3>
                </div>
                
                <div className="space-y-3">
                  {recipients.map((recipient, index) => (
                    <div key={recipient.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: recipient.color || '#3c8787' }}
                      >
                        {recipient.name.charAt(0) || recipient.role.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{recipient.name || `${recipient.role} User`}</div>
                        <div className="text-xs text-gray-500 truncate">{recipient.email}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {recipient.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Field Summary */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#3c8787]" />
                    <h3 className="font-medium text-gray-900">Field Summary</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {(() => {
                      // Count fields using same logic as the display filter
                      const filteredFieldCount = fields.filter(field => {
                        const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                        
                        if (fieldType === 'SIGN_DATE' || fieldType === 'INITIAL_DATE') {
                          // Check if there's a corresponding signature/initial field for the same recipient
                          const targetSignatureType = fieldType === 'SIGN_DATE' ? 'SIGNATURE' : 'INITIALS';
                          const hasCorrespondingSignature = fields.some(f => {
                            const fType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                            return fType === targetSignatureType && f.signerEmail === field.signerEmail;
                          });
                          
                          // Count date field only if it doesn't have a corresponding signature/initial field
                          return !hasCorrespondingSignature;
                        }
                        
                        return true; // Count all non-date fields
                      }).length;
                      return filteredFieldCount;
                    })()} fields
                  </Badge>
                </div>
                
                {fields.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      // Check which signature/initial fields have corresponding date fields for the same recipient
                      const getCorrespondingDateField = (signatureField: any) => {
                        const fieldType = typeof signatureField.type === 'string' ? signatureField.type : (signatureField.type?.type || signatureField.type?.value || '');
                        const targetDateType = fieldType === 'SIGNATURE' ? 'SIGN_DATE' : fieldType === 'INITIALS' ? 'INITIAL_DATE' : null;
                        
                        if (!targetDateType) return null;
                        
                        return fields.find(field => {
                          const fType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                          return fType === targetDateType && field.signerEmail === signatureField.signerEmail;
                        });
                      };
                      
                      // Filter out date fields that have corresponding signature/initial fields
                      const filteredFields = fields.filter(field => {
                        const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                        
                        if (fieldType === 'SIGN_DATE' || fieldType === 'INITIAL_DATE') {
                          // Check if there's a corresponding signature/initial field for the same recipient
                          const targetSignatureType = fieldType === 'SIGN_DATE' ? 'SIGNATURE' : 'INITIALS';
                          const hasCorrespondingSignature = fields.some(f => {
                            const fType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                            return fType === targetSignatureType && f.signerEmail === field.signerEmail;
                          });
                          
                          // Hide date field only if it has a corresponding signature/initial field
                          return !hasCorrespondingSignature;
                        }
                        
                        return true; // Show all non-date fields
                      });
                      
                      return filteredFields.map((field, index) => {
                        const fieldValue = useSignedFieldsStore.getState().signedFields[field.formId];
                        const hasValue = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
                        // Try to find recipient by ID first, then by email, then by role mapping
                        let recipient = recipients.find(r => r.id === field.signerEmail);
                        if (!recipient) {
                          recipient = recipients.find(r => r.email === field.signerEmail);
                        }
                        
                        // Handle different recipient ID patterns by mapping to roles
                        if (!recipient) {
                          const signerEmail = field.signerEmail.toLowerCase();
                          if (signerEmail.includes('host')) {
                            recipient = recipients.find(r => r.role === 'HOST');
                          } else if (signerEmail.includes('renter') || signerEmail.includes('tenant')) {
                            recipient = recipients.find(r => r.role === 'RENTER');
                          }
                        }
                        
                        // Debug logging to understand signerEmail values
                        if (!recipient) {
                          console.log(`🔍 Field ${field.formId} signerEmail: "${field.signerEmail}", Available recipient IDs:`, recipients.map(r => r.id), 'Available emails:', recipients.map(r => r.email), 'Available roles:', recipients.map(r => r.role));
                        }
                        
                        // Get field label with combined signature+date labeling only when both fields exist
                        const getDisplayLabel = (field: any) => {
                          const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                          const recipientRole = recipient?.role || 'Unknown';
                          
                          if (fieldType === 'SIGNATURE' || fieldType === 'INITIALS') {
                            const correspondingDateField = getCorrespondingDateField(field);
                            if (correspondingDateField) {
                              // Both signature/initial and date field exist
                              return `${recipientRole === 'HOST' ? 'Host' : 'Renter'} ${fieldType === 'SIGNATURE' ? 'Signature' : 'Initial'} and Date`;
                            } else {
                              // Only signature/initial field exists
                              return `${recipientRole === 'HOST' ? 'Host' : 'Renter'} ${fieldType === 'SIGNATURE' ? 'Signature' : 'Initial'}`;
                            }
                          }
                          
                          // For other fields, use the original logic
                          return (field.fieldMeta?.label && field.fieldMeta.label !== 'Field') ? field.fieldMeta.label : getFieldLabel(field);
                        };
                        
                        return (
                          <div 
                            key={field.formId} 
                            className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm cursor-pointer transition-colors duration-150"
                            onClick={() => navigateToField(field.formId)}
                            title="Click to navigate to this field in the PDF"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {getDisplayLabel(field)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Page {field.pageNumber} • {recipient?.name || 'Unassigned'}
                              </div>
                            </div>
                            <div className="text-right min-w-0 flex-shrink-0">
                              {hasValue ? (
                                <div className="text-xs text-green-600 font-medium truncate max-w-24" title={String(fieldValue)}>
                                  {String(fieldValue).length > 20 ? `${String(fieldValue).substring(0, 20)}...` : String(fieldValue)}
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Empty
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No fields available
                  </div>
                )}
              </CardContent>
            </Card>


          </>
        )}

        {/* Default signing interface for signer2 */}
        {workflowState === 'signer2' && (
          <>
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: getCurrentSigner()?.color }}
                  >
                    {getCurrentSigner()?.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{getCurrentSigner()?.name}</div>
                    <div className="text-sm text-gray-500">{getCurrentSigner()?.email}</div>
                  </div>
                </div>
                
                {/* Validation Status */}
                <div className="mb-3 space-y-2">
                  {validationStatus === 'valid' && fieldsValidated && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      Document data validated - {fields.length} fields loaded
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600">
                  Click on the fields assigned to you to fill them out and sign the document.
                </p>
              </CardContent>
            </Card>

            {/* Fields to sign */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Your Fields to Complete</h3>
                <div className="space-y-2">
                  {fields
                    .filter(f => f.recipientIndex === 1)
                    .filter(f => ['SIGNATURE', 'INITIALS'].includes(f.type))
                    .map(field => (
                      <div key={field.formId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{FRIENDLY_FIELD_TYPE[field.type]}</span>
                          <span className="text-xs text-gray-500">Page {field.pageNumber}</span>
                        </div>
                        <div className="text-xs">
                          {useSignedFieldsStore.getState().signedFields[field.formId] ? (
                            <Badge variant="default" className="bg-green-500">✓ Signed</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </>
    );
  };

  // Load template functionality
  const loadTemplate = async (template: PdfTemplate) => {
    try {
      console.log('📄 Loading template for document creation:', template.id);
      
      console.log('🔍 Raw template data received:', template);
      
      // Parse template data from database
      const templateData = template.templateData as any;
      const templateFields = templateData.fields || [];
      const templateRecipients = templateData.recipients || [];
      
      console.log('📋 Parsed template data:', { 
        fields: templateFields.length, 
        recipients: templateRecipients.length,
        fieldsData: templateFields,
        recipientsData: templateRecipients
      });
      
      // Set the template fields and recipients
      setFields(templateFields);
      
      // Auto-populate default recipients with real names
      const defaultRecipients = templateRecipients.map(r => {
        if (r.role === 'HOST') {
          return { ...r, name: hostName || 'John Smith', email: hostEmail || 'host@host.com' };
        }
        if (r.role === 'RENTER') {
          return { ...r, name: 'Jane Doe', email: 'renter@renter.com' };
        }
        return r;
      });
      setRecipients(defaultRecipients);
      
      // Load the PDF file from the template
      if (template.pdfFileUrl) {
        console.log('📄 Fetching PDF from:', template.pdfFileUrl);
        const pdfResponse = await fetch(template.pdfFileUrl);
        const pdfBlob = await pdfResponse.blob();
        const pdfFile = new File([pdfBlob], template.pdfFileName, { type: 'application/pdf' });
        console.log('📄 PDF file created:', pdfFile);
        setPdfFile(pdfFile);
      }
      
      // Pre-fill fields based on tags and predefined values
      setTimeout(() => {
        const preFilledFields = {};
        const documentValues = {
          monthlyRent: '2,500.00',
          startDate: new Date().toISOString().split('T')[0], // Today's date
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // One year from now
        };
        
        console.log('🔍 Available recipients for pre-fill:', defaultRecipients);
        console.log('📝 Document values for pre-fill:', documentValues);
        console.log('🔍 Available fields for pre-fill:', templateFields);

        templateFields.forEach((field, index) => {
          console.log(`🔍 Processing field ${index + 1}/${templateFields.length}: ${field.formId} (${field.type})`);
          
          // Pre-fill NAME fields based on recipient roles
          if (field.type === 'NAME') {
            console.log(`📝 Processing NAME field: ${field.formId}, signerEmail: ${field.signerEmail}, recipientIndex: ${field.recipientIndex}`);
            
            // Simplified matching logic - just alternate between HOST and RENTER
            const nameFields = templateFields.filter(f => f.type === 'NAME');
            const nameFieldIndex = nameFields.findIndex(f => f.formId === field.formId);
            
            console.log(`🎯 NEW ALTERNATING LOGIC: Field ${field.formId} is NAME field #${nameFieldIndex} of ${nameFields.length} total NAME fields`);
            
            let recipient;
            if (nameFieldIndex % 2 === 0) {
              // Even index (0, 2, 4...) = HOST
              recipient = defaultRecipients.find(r => r.role === 'HOST');
              console.log(`🎯 Even index ${nameFieldIndex} -> Using HOST:`, recipient);
            } else {
              // Odd index (1, 3, 5...) = RENTER  
              recipient = defaultRecipients.find(r => r.role === 'RENTER');
              console.log(`🎯 Odd index ${nameFieldIndex} -> Using RENTER:`, recipient);
            }
            
            console.log(`🔍 Final recipient for field ${field.formId} (index ${nameFieldIndex}):`, recipient);
            
            // Pre-fill with actual names from default recipients
            if (recipient && recipient.name) {
              preFilledFields[field.formId] = recipient.name;
              console.log(`📝 Pre-filling NAME field ${field.formId} with "${recipient.name}"`);
            } else {
              console.log(`⏭️ No recipient found for NAME field ${field.formId}`);
            }
          }
          
          // Pre-fill common document fields by field type or position
          if (field.type === 'TEXT' || field.type === 'NUMBER') {
            // Pre-fill all TEXT/NUMBER fields with rent for demo purposes
            preFilledFields[field.formId] = documentValues.monthlyRent;
            console.log(`📝 Pre-filling TEXT/NUMBER field ${field.formId} with monthly rent: ${documentValues.monthlyRent}`);
          }
          
          if (field.type === 'DATE') {
            // Alternate between start and end dates based on field index
            const dateFields = templateFields.filter(f => f.type === 'DATE');
            const dateFieldIndex = dateFields.findIndex(f => f.formId === field.formId);
            
            if (dateFieldIndex % 2 === 0) {
              // Even index (0, 2, 4...) = start date
              preFilledFields[field.formId] = documentValues.startDate;
              console.log(`📝 Pre-filling DATE field ${field.formId} with start date: ${documentValues.startDate}`);
            } else {
              // Odd index (1, 3, 5...) = end date
              preFilledFields[field.formId] = documentValues.endDate;
              console.log(`📝 Pre-filling DATE field ${field.formId} with end date: ${documentValues.endDate}`);
            }
          }
        });
        
        console.log('✅ Pre-filled fields (should be handled by parent):', preFilledFields);
      }, 100);
      
      // Store current template ID for document creation
      sessionStorage.setItem('currentTemplateId', template.id);
      
      // Set to document mode instead of template mode for editing with real data
      setWorkflowState('document');
      
      console.log('✅ Template loaded into document editor:', {
        templateId: template.id,
        fields: templateFields.length,
        recipients: templateRecipients.length,
        fieldsData: templateFields,
        recipientsData: templateRecipients
      });
    } catch (error) {
      console.error('❌ Error loading template:', error);
      brandAlert('Failed to load template: ' + error.message, 'error', 'Load Failed');
    }
  };

  // Load document functionality for signing
  const loadDocumentForSigning = async (document: any) => {
    try {
      // Reset validation state
      setFieldsValidated(false);
      setValidationStatus('validating');
      
      console.log('📄 Loading document for signing:', document.id);
      console.log('📄 Full document object:', document);
      console.log('📄 Available document properties:', Object.keys(document));
      
      // Parse document data - check multiple possible locations
      let documentData = document.templateData || document.documentData || document.data;
      
      console.log('📄 Document data found:', documentData);
      console.log('📄 Document data type:', typeof documentData);
      console.log('📄 Document data keys:', documentData ? Object.keys(documentData) : 'null');
      
      if (!documentData) {
        throw new Error('No document data found. Expected templateData, documentData, or data property.');
      }
      
      const documentFields = documentData.fields || [];
      const documentRecipients = documentData.recipients || [];
      
      console.log('📋 Parsed document data:', { 
        fields: documentFields.length, 
        recipients: documentRecipients.length,
        fieldsData: documentFields,
        recipientsData: documentRecipients
      });
      
      // Validate that we have the essential data
      if (documentFields.length === 0) {
        throw new Error('No fields found in document. Document may be corrupted or incomplete.');
      }
      
      if (documentRecipients.length === 0) {
        throw new Error('No recipients found in document. Document may be corrupted or incomplete.');
      }
      
      // Validate field structure
      const invalidFields = documentFields.filter(field => 
        !field.formId || 
        !field.type || 
        field.pageX === undefined || 
        field.pageY === undefined ||
        field.pageWidth === undefined ||
        field.pageHeight === undefined
      );
      
      if (invalidFields.length > 0) {
        console.error('❌ Invalid fields found:', invalidFields);
        throw new Error(`${invalidFields.length} fields have missing required properties (formId, type, positioning). Document may be corrupted.`);
      }
      
      // Validate recipient structure
      const invalidRecipients = documentRecipients.filter(recipient =>
        !recipient.id || 
        !recipient.name ||
        !recipient.color
      );
      
      if (invalidRecipients.length > 0) {
        console.error('❌ Invalid recipients found:', invalidRecipients);
        throw new Error(`${invalidRecipients.length} recipients have missing required properties (id, name, color). Document may be corrupted.`);
      }
      
      console.log('✅ Field and recipient validation passed');
      
      // Set the document fields and recipients
      setFields(documentFields);
      setRecipients(documentRecipients);
      
      // Mark validation as successful
      setValidationStatus('valid');
      setFieldsValidated(true);
      
      // Load the PDF file from the document
      if (document.pdfFileUrl) {
        console.log('📄 Fetching PDF from:', document.pdfFileUrl);
        const pdfResponse = await fetch(document.pdfFileUrl);
        const pdfBlob = await pdfResponse.blob();
        const pdfFile = new File([pdfBlob], document.pdfFileName, { type: 'application/pdf' });
        console.log('📄 PDF file created:', pdfFile);
        setPdfFile(pdfFile);
      }
      
      // Load any existing signed fields from the document response (already includes fieldValues)
      console.log('📝 Loading existing signed fields from document...');
      const existingSignedFields = {};
      
      if (document.fieldValues && document.fieldValues.length > 0) {
        // Convert the field values array to an object keyed by fieldId
        document.fieldValues.forEach(fieldValue => {
          // Check if the value is a signature object and handle it safely
          let displayValue = fieldValue.value;
          if (typeof fieldValue.value === 'object' && fieldValue.value !== null && 'type' in fieldValue.value) {
            console.log(`🔍 Found signature object for ${fieldValue.fieldId}:`, fieldValue.value);
            // For signature objects, just store a boolean to indicate it's signed
            displayValue = true;
          }
          
          existingSignedFields[fieldValue.fieldId] = displayValue;
          console.log(`📝 Loaded signed value for ${fieldValue.fieldId}: "${displayValue}" (signer: ${fieldValue.signerIndex})`);
        });
        
        console.log('📝 All existing signed fields loaded (should be handled by parent):', existingSignedFields);
      } else {
        console.log('📝 No existing signed fields found, starting fresh (should be handled by parent)');
      }
      
      // Store current document ID for signing session
      sessionStorage.setItem('currentDocumentId', document.id);
      
      // Set to the appropriate signer state
      if (pendingSignerType) {
        setWorkflowState(pendingSignerType);
        setPendingSignerType(null);
      }
      
      // Close the document selector
      setShowDocumentSelector(false);
      
      console.log('✅ Document loaded for signing:', {
        documentId: document.id,
        fields: documentFields.length,
        recipients: documentRecipients.length,
        signerType: pendingSignerType
      });
    } catch (error) {
      console.error('❌ Error loading document for signing:', error);
      setValidationStatus('invalid');
      setFieldsValidated(false);
      brandAlert('Failed to load document: ' + error.message, 'error', 'Load Failed');
    }
  };

  // Create document and transition to signing
  const createDocumentAndStartSigning = async () => {
    if (!pdfFile) {
      throw new Error('No PDF file available');
    }
    
    // First save the document (similar to saveDocument but with signing transition)
    let documentId = sessionStorage.getItem('currentDocumentId');
    let templateId = sessionStorage.getItem('currentTemplateId');
    
    // For merged documents, we should already have a document ID
    if (isMergedDocument && documentId) {
      // Document already exists and is ready for signing
      setWorkflowState('signer1');
      setIsCreatingDocument(false);
      return;
    }
    
    // If no document exists yet, create one from the current template
    if (!documentId && templateId) {
      
      const createResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          documentData: {
            fields,
            recipients,
            metadata: { pageWidth },
            signedFields // Include any pre-filled values
          },
          status: 'IN_PROGRESS', // Document is now ready for signing
          currentStep: 'signer1' // Start with first signer
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create document');
      }

      const { document } = await createResponse.json();
      documentId = document.id;
      sessionStorage.setItem('currentDocumentId', documentId);
      
    } else if (documentId) {
      // Update existing document to ready for signing
      const updateResponse = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentData: {
            fields,
            recipients,
            metadata: { pageWidth },
            signedFields
          },
          status: 'IN_PROGRESS',
          currentStep: 'signer1'
        }),
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Failed to update document:', updateResponse.status, errorText);
        throw new Error(`Failed to update document: ${updateResponse.status} ${errorText}`);
      }
    } else {
      throw new Error('No template or document ID found. Please start from template creation.');
    }
    
    // Transition to signing mode
    setWorkflowState('signer1');
    setIsCreatingDocument(false);
  };

  // Step completion handler
  const completeCurrentStep = async () => {
    console.log('🎯🎯🎯 COMPLETE CURRENT STEP CALLED! 🎯🎯🎯');
    console.log('📋 PDFEditor completeCurrentStep context:', {
      workflowState,
      housingRequestId: housingRequestId || 'UNDEFINED!',
      hasHousingRequestId: !!housingRequestId,
      recipientsCount: recipients.length
    });
    
    const stepNames = {
      'template': 'Template Creation',
      'document': 'Document Creation', 
      'signer1': 'Signer 1',
      'signer2': 'Signer 2',
      'completed': 'Document Completion'
    };

    const stepName = stepNames[workflowState] || workflowState;

    switch (workflowState) {
      case 'template':
        // Start loading for template workflow
        setIsSavingTemplate(true);
        
        if (!pdfFile) {
          brandAlert('Please upload a PDF file first.', 'warning', 'File Required');
          setIsSavingTemplate(false);
          return;
        }
        

        if (!templateType || templateType === '') {
          
          brandAlert('Please select a template type (lease or addendum).', 'warning', 'Template Type Required');
          setIsSavingTemplate(false);
          return;
        }
        
        if (fields.length === 0) {
          brandAlert('Please add some fields to your template first!', 'warning', 'Fields Required');
          setIsSavingTemplate(false);
          return;
        }
        
        // For lease templates, check if all required fields are present
        // Note: API defaults empty type to 'lease', so validate unless explicitly 'addendum'

        if (templateType === 'lease' || !templateType || templateType === '') {
          const requiredFieldTypes = ['host-signature', 'host-name', 'renter-signature', 'renter-name', 'rent-amount', 'move-in-date', 'move-out-date'];
          const fieldStatuses = requiredFieldTypes.map(fieldType => ({
            fieldType,
            status: getRequiredFieldStatus(fieldType)
          }));
          const missingRequiredFields = requiredFieldTypes.filter(fieldType => !getRequiredFieldStatus(fieldType));
          
          
          if (missingRequiredFields.length > 0) {
            setMissingFields(missingRequiredFields);
            setShowMissingFieldsDialog(true);
            setIsSavingTemplate(false);
            return;
          }
        }
        
        try {
          // Save the template with callback for success navigation
          await saveTemplate(() => {
            if (onSave && pdfFile) {
              onSave({ fields, recipients, pdfFile });
            }
          });
        } finally {
          setIsSavingTemplate(false);
        }
        break;
        
      case 'document':
        if (fields.length === 0) {
          brandAlert('Please add some fields before finishing!', 'warning', 'Fields Required');
          return;
        }
        
        // If onSave callback is provided, use it instead of internal API calls
        if (onSave && pdfFile) {
          setIsCreatingDocument(true);
          try {
            await onSave({ fields, recipients, pdfFile });
            
            // Check if we have a document ID to transition to signing
            const documentId = sessionStorage.getItem('currentDocumentId');
            if (documentId && onDocumentCreated) {
              onDocumentCreated(documentId);
              
              // Update document status to IN_PROGRESS for signing
              try {
                await fetch(`/api/documents/${documentId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: 'IN_PROGRESS',
                    currentStep: 'signer1'
                  }),
                });
              } catch (error) {
                console.error('Failed to update document status:', error);
              }
              
              // If this is being called from the host signing flow, approve the housing request
              if (housingRequestId && signerRole === 'host') {
                console.log('🏠 Document creation complete - approving housing request from document case');
                try {
                  const result = await handleSignerCompletion(documentId, 0, recipients, housingRequestId);
                  if (!result.success) {
                    console.error('❌ Housing request approval failed:', result.error);
                    brandAlert(`Failed to approve housing request: ${result.error}`, 'error', 'Approval Error');
                  } else {
                    console.log('✅ Housing request approved successfully from document case');
                    
                    // Show success message
                    brandAlert('🎉 Success! The lease has been signed and the housing request has been approved. The applicant will be notified and can now view the match in their search results.', 'success', 'Lease Signed & Request Approved');
                    
                    // Navigate to success page or back to application details
                    setTimeout(() => {
                      const hostRedirectUrl = sessionStorage.getItem('hostSigningRedirectUrl');
                      if (hostRedirectUrl) {
                        console.log('🔄 Redirecting to:', hostRedirectUrl);
                        sessionStorage.removeItem('hostSigningRedirectUrl'); // Clean up
                        window.location.href = hostRedirectUrl;
                      } else if (onFinish) {
                        onFinish('Housing Request Approved');
                      }
                    }, 2000); // Give user time to read the success message
                  }
                } catch (error) {
                  console.error('❌ Error approving housing request from document case:', error);
                  brandAlert('Error approving housing request. Please try again.', 'error', 'Approval Error');
                }
              }
              
              // Transition to signing workflow
              setWorkflowState('signer1');
            }
          } catch (error) {
            console.error('Error in onSave callback:', error);
            brandAlert('Failed to save document: ' + error.message, 'error', 'Save Failed');
          } finally {
            setIsCreatingDocument(false);
          }
          return;
        }
        
        // Set loading state for document creation
        setIsCreatingDocument(true);
        
        try {
          // Create the document and transition to signing
          await createDocumentAndStartSigning();
          return; // Don't continue to the normal completion flow
        } catch (error) {
          console.error('❌ Error creating document:', error);
          brandAlert('Failed to create document: ' + error.message, 'error', 'Creation Failed');
          setIsCreatingDocument(false);
          return;
        }
        break;
        
      case 'signer1':
      case 'signer2':
        // Check if all required fields are signed
        const currentSignerIndex = workflowState === 'signer1' ? 0 : 1;
        const signerFields = fields.filter(f => f.recipientIndex === currentSignerIndex && ['SIGNATURE', 'INITIALS'].includes(f.type));
        const unSignedFields = signerFields.filter(f => !useSignedFieldsStore.getState().signedFields[f.formId]);
        if (unSignedFields.length > 0) {
          brandAlert('Please complete all required fields before finishing!', 'warning', 'Fields Incomplete');
          return;
        }
        
        try {
          // Save signing progress to the backend (always use proper signing workflow)
          console.log(`🖊️ Saving signing progress for signer ${currentSignerIndex + 1}...`);
          await saveSignerProgressAsync(currentSignerIndex);
          
          // Call server action to handle notifications and booking creation
          const documentId = sessionStorage.getItem('currentDocumentId');
          console.log(`🔍 Debug - Complete step called with:`, {
            currentSignerIndex,
            documentId,
            housingRequestId,
            hasHousingRequestId: !!housingRequestId,
            recipientsCount: recipients.length,
            workflowState
          });
          
          if (documentId) {
            console.log(`📤 Calling server action for signer completion...`);
            console.log(`📋 handleSignerCompletion params:`, {
              documentId,
              currentSignerIndex,
              recipientsLength: recipients.length,
              housingRequestId: housingRequestId || 'MISSING!',
              isHost: currentSignerIndex === 0
            });
            
            const result = await handleSignerCompletion(documentId, currentSignerIndex, recipients, housingRequestId);
            if (!result.success) {
              console.error('❌ Server action failed:', result.error);
              brandAlert(`Failed to process signing completion: ${result.error}`, 'error', 'Signing Error');
              return; // Stop processing if server action failed
            } else {
              console.log('✅ handleSignerCompletion succeeded');
            }
          } else {
            console.error('❌ No document ID found in session storage!');
            brandAlert('Document ID not found. Please try refreshing the page.', 'error', 'Document Error');
          }
          
          // Transition workflow state
          if (workflowState === 'signer1') {
            // Check if host should be redirected after signing
            const hostRedirectUrl = sessionStorage.getItem('hostSigningRedirectUrl');
            if (hostRedirectUrl) {
              console.log('✅ Host completed signing, redirecting to:', hostRedirectUrl);
              sessionStorage.removeItem('hostSigningRedirectUrl'); // Clean up
              router.push(hostRedirectUrl);
              return; // Exit early to avoid further state changes
            }
            
            // Move to signer2 if there's a second recipient
            if (recipients.length > 1 && recipients[1]) {
              console.log('✅ Signer 1 completed, transitioning to signer 2');
              setWorkflowState('signer2');
            } else {
              // Complete the document if only one signer
              console.log('✅ Single signer completed, document finished');
              setWorkflowState('completed');
            }
          } else if (workflowState === 'signer2') {
            // Complete the document
            console.log('✅ Signer 2 completed, document finished');
            setWorkflowState('completed');
          }
          
          // Reset validation states for the next step
          setValidationStatus('valid');
          setFieldsValidated(true);
          
        } catch (error) {
          console.error('❌ Error saving signing progress:', error);
          brandAlert('Failed to save signing progress: ' + error.message, 'error', 'Save Failed');
          return;
        }
        break;
    }

    // Set completion state
    setStepCompleted(true);

    // Call onFinish if provided, otherwise show default success
    if (onFinish) {
      onFinish(stepName);
    }
  };

  // Expose complete step function to parent component using ref approach to avoid loops
  const onCompleteStepReadyRef = useRef(onCompleteStepReady);
  onCompleteStepReadyRef.current = onCompleteStepReady;
  
  useEffect(() => {
    if (onCompleteStepReadyRef.current && workflowState === 'document') {
      onCompleteStepReadyRef.current(completeCurrentStep);
    }
  }, [workflowState]);

  // Expose signing action function to parent component during signing states
  const onSigningActionReadyRef = useRef(onSigningActionReady);
  onSigningActionReadyRef.current = onSigningActionReady;

  useEffect(() => {
    if (onSigningActionReadyRef.current && (workflowState === 'signer1' || workflowState === 'signer2')) {
      onSigningActionReadyRef.current(handleSigningAction);
    }
  }, [workflowState]);

  // Navigation functions removed - components are now isolated

  // Get current signer for signing workflow
  const getCurrentSigner = () => {
    if (workflowState === 'signer1') return recipients[0];
    if (workflowState === 'signer2') return recipients[1];
    return null;
  };

  // Get appropriate field label based on type and recipient
  const getFieldLabel = (field: FieldFormType) => {
    // Add debug logging for field type issues
    if (!field.type) {
      console.warn('Field has no type:', field);
      return 'Unknown Field';
    }

    // Better recipient determination with proper undefined handling
    let recipientPrefix = 'Unassigned';
    if (field.recipientIndex === 0) {
      recipientPrefix = 'Host';
    } else if (field.recipientIndex === 1) {
      recipientPrefix = 'Primary Renter';
    } else if (field.signerEmail) {
      // Fallback to signerEmail analysis
      if (field.signerEmail.includes('host')) {
        recipientPrefix = 'Host';
      } else if (field.signerEmail.includes('renter')) {
        recipientPrefix = 'Primary Renter';
      }
    }
    
    switch (field.type) {
      case 'SIGNATURE':
      case FieldType.SIGNATURE:
        return `${recipientPrefix} Signature`;
      case 'INITIALS':
      case FieldType.INITIALS:
        return `${recipientPrefix} Initials`;
      case 'NAME':
      case FieldType.NAME:
        return `${recipientPrefix} Name`;
      case 'EMAIL':
      case FieldType.EMAIL:
        return `${recipientPrefix} Email`;
      case 'SIGN_DATE':
      case FieldType.SIGN_DATE:
        return `${recipientPrefix} Sign Date`;
      case 'INITIAL_DATE':
      case FieldType.INITIAL_DATE:
        return `${recipientPrefix} Initial Date`;
      case 'DATE':
      case FieldType.DATE:
        // Try to identify date purpose from context
        const fieldLabel = field.fieldMeta?.label?.toLowerCase() || '';
        if (fieldLabel.includes('move') || fieldLabel.includes('start') || fieldLabel.includes('begin')) {
          return 'Move-in Date';
        } else if (fieldLabel.includes('end') || fieldLabel.includes('expire') || fieldLabel.includes('terminate')) {
          return 'Move-out Date';
        } else if (fieldLabel.includes('sign')) {
          return 'Signing Date';
        } else {
          return `Date (Page ${field.pageNumber})`;
        }
      case 'NUMBER':
      case FieldType.NUMBER:
        // Try to identify number field purpose
        const numberLabel = field.fieldMeta?.label?.toLowerCase() || '';
        if (numberLabel.includes('rent') || numberLabel.includes('price')) {
          return 'Monthly Rent';
        } else if (numberLabel.includes('deposit')) {
          return 'Security Deposit';
        } else {
          return `Amount (Page ${field.pageNumber})`;
        }
      case 'TEXT':
      case FieldType.TEXT:
        // Try to identify text field purpose
        const textLabel = field.fieldMeta?.label?.toLowerCase() || '';
        if (textLabel.includes('address') || textLabel.includes('property')) {
          return 'Property Address';
        } else if (textLabel.includes('rent')) {
          return 'Rent Amount';
        } else {
          return `Text (Page ${field.pageNumber})`;
        }
      case 'RADIO':
      case FieldType.RADIO:
        return `Radio Options (Page ${field.pageNumber})`;
      case 'CHECKBOX':
      case FieldType.CHECKBOX:
        return `Checkbox (Page ${field.pageNumber})`;
      case 'DROPDOWN':
      case FieldType.DROPDOWN:
        return `Dropdown (Page ${field.pageNumber})`;
      default:
        console.warn('Unknown field type in getFieldLabel:', {
          type: field.type,
          recipientIndex: field.recipientIndex,
          signerEmail: field.signerEmail,
          formId: field.formId,
          fieldMeta: field.fieldMeta
        });
        const friendlyName = FRIENDLY_FIELD_TYPE[field.type] || field.type;
        return recipientPrefix !== 'Unassigned' ? `${recipientPrefix} ${friendlyName}` : friendlyName;
    }
  };

  // Get unsigned fields for current signer - requires explicit signedFields parameter
  const getUnsignedFields = (currentSignedFields: Record<string, any>) => {
    const currentSignerIndex = workflowState === 'signer1' ? 0 : 1;
    const allSignatureFields = fields.filter(f => {
      if (f.recipientIndex !== currentSignerIndex) return false;
      
      // Use same field type extraction logic as HostSidebarFrame
      const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
      return ['SIGNATURE', 'INITIALS'].includes(fieldType);
    });
    
    // Use same simple truthy check as sidebar (which works correctly)
    const unsignedFields = allSignatureFields.filter(f => {
      const value = currentSignedFields[f.formId];
      
      // Use simple truthy check like sidebar instead of complex check
      const isSigned = !!value; // Same as sidebar: value ? 'signed' : 'pending'
      
      // Log for debugging
      if (f.formId === 'LxS-E2U7k7Z7' || f.formId === 'LgqJ5yFm37Ic') {
        console.log(`🔍 Field ${f.formId} signed status:`, {
          value: value,
          isSigned: isSigned,
          signedFieldsKeys: Object.keys(currentSignedFields),
          hasTargetField: f.formId in currentSignedFields
        });
      }
      
      return !isSigned;
    });
    
    // Focus on first unsigned field for debugging
    const firstUnsignedField = unsignedFields[0];
    if (firstUnsignedField) {
      const value = currentSignedFields[firstUnsignedField.formId];
      console.log('🔍 FIRST UNSIGNED FIELD:', {
        formId: firstUnsignedField.formId,
        type: firstUnsignedField.type,
        isInSignedFields: firstUnsignedField.formId in currentSignedFields,
        signedFieldValue: value,
        signedFieldType: typeof value,
        signedFieldKeys: typeof value === 'object' && value ? Object.keys(value) : null,
        totalUnsignedCount: unsignedFields.length
      });
    } else {
      console.log('🔍 NO UNSIGNED FIELDS - All signature fields are signed');
    }
    
    return unsignedFields;
  };

  // Navigate to specific field and flash it
  const navigateToField = (fieldId: string) => {
    console.log('🎯 navigateToField: Starting navigation to field:', fieldId);
    
    const targetField = fields.find(f => f.formId === fieldId);
    if (!targetField) {
      console.warn('🎯 navigateToField: Field not found:', fieldId);
      return;
    }

    // Log field information to API for troubleshooting
    const logFieldClick = async () => {
      try {
        const recipient = recipients.find(r => r.id === targetField.signerEmail);
        const fieldValue = useSignedFieldsStore.getState().signedFields[targetField.formId];
        
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'info',
            message: 'Field Click Debug Information',
            data: {
              fieldId: fieldId,
              field: {
                formId: targetField.formId,
                type: targetField.type,
                recipientIndex: targetField.recipientIndex,
                signerEmail: targetField.signerEmail,
                pageNumber: targetField.pageNumber,
                fieldMeta: targetField.fieldMeta,
                pageX: targetField.pageX,
                pageY: targetField.pageY,
                pageWidth: targetField.pageWidth,
                pageHeight: targetField.pageHeight
              },
              recipient: recipient ? {
                id: recipient.id,
                name: recipient.name,
                email: recipient.email,
                role: recipient.role,
                color: recipient.color
              } : null,
              fieldValue: fieldValue,
              hasValue: fieldValue !== undefined && fieldValue !== null && fieldValue !== '',
              generatedLabel: getFieldLabel(targetField),
              workflowState: workflowState,
              totalFields: fields.length,
              timestamp: new Date().toISOString()
            }
          }),
        });
        console.log('✅ Field click logged to API');
      } catch (error) {
        console.error('❌ Failed to log field click:', error);
      }
    };

    // Log field information asynchronously
    logFieldClick();
    
    // Find the field element first
    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`) as HTMLElement;
    console.log('🎯 navigateToField: Field element found:', !!fieldElement);
    
    if (fieldElement) {
      // Scroll directly to the field and center it in the viewport
      fieldElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
        inline: 'center' 
      });
      console.log('🎯 navigateToField: Scrolled to field');
      
      // Apply flash effect after scroll completes
      setTimeout(() => {
        // Store original styles
        const originalBg = fieldElement.style.backgroundColor;
        const originalTransition = fieldElement.style.transition;
        const originalBoxShadow = fieldElement.style.boxShadow;
        
        // Apply flash effect using inline styles
        fieldElement.style.transition = 'all 0.3s ease';
        fieldElement.style.backgroundColor = '#3c8787'; // brand color
        fieldElement.style.boxShadow = '0 0 20px rgba(60, 135, 135, 0.5)'; // Add glow effect
        console.log('🎯 navigateToField: Applied first flash');
        
        setTimeout(() => {
          fieldElement.style.backgroundColor = originalBg || '';
          fieldElement.style.boxShadow = originalBoxShadow || '';
          console.log('🎯 navigateToField: Removed first flash');
          
          setTimeout(() => {
            fieldElement.style.backgroundColor = '#3c8787';
            fieldElement.style.boxShadow = '0 0 20px rgba(60, 135, 135, 0.5)';
            console.log('🎯 navigateToField: Applied second flash');
            
            setTimeout(() => {
              fieldElement.style.backgroundColor = originalBg || '';
              fieldElement.style.boxShadow = originalBoxShadow || '';
              fieldElement.style.transition = originalTransition || '';
              console.log('🎯 navigateToField: Completed flashing');
            }, 300);
          }, 300);
        }, 300);
      }, 600); // Wait for scroll to complete
    } else {
      console.warn('🎯 navigateToField: Could not find field element, trying page fallback');
      
      // Fallback: scroll to page if field element not found
      const pageElement = document.querySelector(`[data-pdf-viewer-page][data-page-number="${targetField.pageNumber}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('🎯 navigateToField: Scrolled to page as fallback');
      }
    }
  };

  // Navigate to next unsigned field and flash it
  const navigateToNextField = () => {
    const currentSignedFields = useSignedFieldsStore.getState().signedFields;
    const unsignedFields = getUnsignedFields(currentSignedFields);
    
    if (unsignedFields.length === 0) {
      return;
    }

    const nextField = unsignedFields[0];
    
    // Find the field element first
    const fieldElement = document.querySelector(`[data-field-id="${nextField.formId}"]`) as HTMLElement;
    
    if (fieldElement) {
      // Scroll directly to the field and center it in the viewport
      fieldElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
        inline: 'center' 
      });
      
      // Apply flash effect after scroll completes
      setTimeout(() => {
        // Store original styles
        const originalBg = fieldElement.style.backgroundColor;
        const originalTransition = fieldElement.style.transition;
        const originalBoxShadow = fieldElement.style.boxShadow;
        
        // Apply flash effect using inline styles
        fieldElement.style.transition = 'all 0.3s ease';
        fieldElement.style.backgroundColor = '#0B6E6E'; // secondaryBrand color
        fieldElement.style.boxShadow = '0 0 20px rgba(11, 110, 110, 0.5)'; // Add glow effect
        
        setTimeout(() => {
          fieldElement.style.backgroundColor = originalBg || '';
          fieldElement.style.boxShadow = originalBoxShadow || '';
          
          setTimeout(() => {
            fieldElement.style.backgroundColor = '#0B6E6E';
            fieldElement.style.boxShadow = '0 0 20px rgba(11, 110, 110, 0.5)';
            
            setTimeout(() => {
              fieldElement.style.backgroundColor = originalBg || '';
              fieldElement.style.boxShadow = originalBoxShadow || '';
              fieldElement.style.transition = originalTransition || '';
            }, 300);
          }, 300);
        }, 300);
      }, 600); // Wait for scroll to complete
    } else {
      console.warn('🎯 navigateToNextField: Could not find field element, trying page fallback');
      
      // Fallback: scroll to page if field element not found
      const pageElement = document.querySelector(`[data-pdf-viewer-page][data-page-number="${nextField.pageNumber}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('🎯 navigateToNextField: Scrolled to page as fallback');
      }
    }
  };

  // Handle signing button click - using Zustand store directly
  const handleSigningAction = async () => {
    console.log('🚨🚨🚨 YOU CLICKED THE SAVE AND SEND BUTTON (PDFEditor)! 🚨🚨🚨');
    const currentSignedFields = useSignedFieldsStore.getState().signedFields;
    
    // COMPREHENSIVE DEBUG LOGGING
    console.group('🔍 DEBUG: Footer Field Analysis for Next Action Button');
    console.log('Workflow State:', workflowState);
    console.log('Total fields in document:', fields.length);
    console.log('All fields with details:', fields.map(f => ({
      id: f.formId,
      type: typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || 'unknown'),
      recipientIndex: f.recipientIndex,
      isSigned: !!currentSignedFields[f.formId],
      signedValue: currentSignedFields[f.formId]
    })));

    // Show filtering for signer2 (renter)
    if (workflowState === 'signer2') {
      console.log('--- RENTER FIELD FILTERING ANALYSIS ---');
      
      // Show what the display filter would show
      const displayFilteredFields = fields.filter((field) => {
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
        return false;
      });
      console.log('Display filtered fields (what renter should see):', displayFilteredFields.length, displayFilteredFields);
      
      // Show what the footer counter should count
      const footerCountedFields = fields.filter(f => {
        // For renter, only count their signature/initial fields
        if (f.recipientIndex === 1) {
          const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
          return fieldType === 'SIGNATURE' || fieldType === 'INITIALS';
        }
        return false;
      });
      console.log('Footer should count these fields:', footerCountedFields.length, footerCountedFields);
      
      // Show what getUnsignedFields returns
      const unsignedFromFunction = getUnsignedFields(currentSignedFields);
      console.log('getUnsignedFields returns:', unsignedFromFunction.length, unsignedFromFunction);
      
      console.log('--- FIELD COUNT MISMATCH CHECK ---');
      console.log('Expected: Display=', displayFilteredFields.length, ', Footer=', footerCountedFields.length, ', Unsigned=', unsignedFromFunction.length);
      console.log('If footer shows 18 instead of', footerCountedFields.length, ', the footer counting logic is not working');
    }
    
    console.log('Signed fields state:', Object.keys(currentSignedFields).length, 'signed fields:', currentSignedFields);
    console.groupEnd();

    console.log('🎬 handleSigningAction - signedFields keys:', Object.keys(currentSignedFields));
    console.log('🎬 handleSigningAction - LxS-E2U7k7Z7 value:', currentSignedFields['LxS-E2U7k7Z7']);
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
    console.log('💾 PDFEditor - saveUserInitials called with:', {
      initials: initials,
      currentUserInitials: currentUserInitials
    });
    
    try {
      console.log('💾 PDFEditor - Calling updateUserInitials server action');
      await updateUserInitials(initials);
      console.log('💾 PDFEditor - Server action completed successfully');
      
      // Update client-side state immediately so dialog won't show again this session
      setCurrentUserInitials(initials);
      console.log('💾 PDFEditor - Updated client-side currentUserInitials to:', initials);
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
    if (workflowState === 'signer1' || workflowState === 'signer2') {
      fetchSavedSignatures();
    }
  }, [workflowState]);

  // Handle field signing/filling
  const signField = (fieldId: string, value: any) => {
    const field = fields.find(f => f.formId === fieldId);
    
    // Check if this is a signature/initial field being signed
    if (field && ['SIGNATURE', 'INITIALS'].includes(field.type)) {
      console.log('🖋️ SIGNING FIELD:', {
        fieldId,
        fieldType: field.type,
        wasAlreadySigned: !!useSignedFieldsStore.getState().signedFields[fieldId],
        signedValue: value
      });
      
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
    console.log('🔍 startFieldDetection called:', { fieldType, recipientId, label, mouseX: mouseEvent.clientX, mouseY: mouseEvent.clientY });
    console.log('🔍 Setting states:', {
      selectedField: `${selectedField} → ${fieldType}`,
      selectedRecipient: `${selectedRecipient} → ${recipientId}`,
      pendingFieldLabel: `${pendingFieldLabel} → ${label || 'undefined'}`,
      interactionMode: `${interactionMode} → detecting`
    });
    
    setSelectedField(fieldType);
    setSelectedRecipient(recipientId);
    if (label) setPendingFieldLabel(label);
    setInteractionMode('detecting');
    setIsMouseDown(true);
    setMouseDownPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
    console.log('🔍 Detection mode state set');
  };

  // Legacy function for backward compatibility
  const startFieldPlacement = (fieldType: FieldType, recipientId: string, label?: string) => {
    setSelectedField(fieldType);
    setSelectedRecipient(recipientId);
    if (label) setPendingFieldLabel(label);
    setIsDragging(true);
    setInteractionMode('click-to-place');
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
    // Log validation status after adding custom field
    setTimeout(() => logValidationStatus('After Custom Field Added'), 0);
    
    // Close dialog
    setCustomFieldDialog({ isOpen: false, field: null });
    
    console.log('✅ Custom field saved with metadata:', updatedField);
  };

  const handleCustomFieldCancel = () => {
    setCustomFieldDialog({ isOpen: false, field: null });
    console.log('❌ Custom field creation cancelled');
  };

  // Validate that field components are actually rendered in the DOM
  const validateFieldRendering = useCallback(async () => {
    if (fields.length === 0) {
      setRenderingStatus('pending');
      setFieldsRendered(false);
      return;
    }

    setRenderingStatus('checking');
    console.log('🎨 Starting field rendering validation...');

    // Wait a short time for React to finish rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    let renderedCount = 0;
    let totalFields = fields.length;
    const missingFields: string[] = [];

    for (const field of fields) {
      // Look for the field element in the DOM using data attributes
      const fieldElement = document.querySelector(`[data-field-id="${field.formId}"]`);
      
      if (fieldElement) {
        // Check if the element is actually visible and positioned
        const rect = fieldElement.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && rect.top >= 0;
        
        if (isVisible) {
          renderedCount++;
          console.log(`✅ Field ${field.formId} (${field.type}) rendered and visible`);
        } else {
          missingFields.push(`${field.formId} (${field.type}) - element exists but not visible`);
          console.warn(`⚠️ Field ${field.formId} (${field.type}) exists in DOM but not visible:`, rect);
        }
      } else {
        missingFields.push(`${field.formId} (${field.type}) - not found in DOM`);
        console.error(`❌ Field ${field.formId} (${field.type}) not found in DOM`);
      }
    }

    const allRendered = renderedCount === totalFields;
    
    console.log(`🎨 Rendering validation complete: ${renderedCount}/${totalFields} fields rendered`);
    
    if (allRendered) {
      setRenderingStatus('rendered');
      setFieldsRendered(true);
      console.log('✅ All fields successfully rendered and visible');
    } else {
      setRenderingStatus('failed');
      setFieldsRendered(false);
      console.error('❌ Some fields failed to render:', missingFields);
    }

    return allRendered;
  }, [fields]);

  // Auto-validate rendering when fields change
  useEffect(() => {
    if (fields.length > 0 && (workflowState === 'signer1' || workflowState === 'signer2')) {
      // Delay validation to allow PDF and fields to fully load
      const timeoutId = setTimeout(() => {
        validateFieldRendering();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fields, workflowState, validateFieldRendering]);

  // Log comprehensive validation status
  const logValidationStatus = (context: string) => {
    const requiredFieldTypes = ['host-signature', 'host-name', 'renter-signature', 'renter-name', 'rent-amount', 'move-in-date', 'move-out-date'];
    const fieldStatuses = requiredFieldTypes.map(fieldType => ({
      fieldType,
      status: getRequiredFieldStatus(fieldType),
      fieldsOfType: fields.filter(f => {
        const requiredFieldMap = {
          'host-signature': { type: FieldType.SIGNATURE, recipientIndex: 0 },
          'host-name': { type: FieldType.NAME, recipientIndex: 0 },
          'renter-signature': { type: FieldType.SIGNATURE, recipientIndex: 1 },
          'renter-name': { type: FieldType.NAME, recipientIndex: 1 },
          'rent-amount': { type: FieldType.NUMBER, label: 'Rent Amount' },
          'move-in-date': { type: FieldType.DATE, label: 'Move In Date' },
          'move-out-date': { type: FieldType.DATE, label: 'Move Out Date' }
        };
        const config = requiredFieldMap[fieldType as keyof typeof requiredFieldMap];
        if (config.recipientIndex !== undefined) {
          return f.type === config.type && f.recipientIndex === config.recipientIndex;
        }
        return f.type === config.type && f.fieldMeta?.label === config.label;
      }).length
    }));

    const missingFields = fieldStatuses.filter(f => !f.status).map(f => f.fieldType);
    
  };

  // Check if required fields are placed
  const getRequiredFieldStatus = (fieldType: string) => {
    const requiredFieldMap = {
      'host-signature': { type: FieldType.SIGNATURE, recipientIndex: 0 },
      'host-name': { type: FieldType.NAME, recipientIndex: 0 },
      'renter-signature': { type: FieldType.SIGNATURE, recipientIndex: 1 },
      'renter-name': { type: FieldType.NAME, recipientIndex: 1 },
      'rent-amount': { type: FieldType.NUMBER, label: 'Rent Amount' },
      'move-in-date': { type: FieldType.DATE, label: 'Move In Date' },
      'move-out-date': { type: FieldType.DATE, label: 'Move Out Date' }
    };

    const config = requiredFieldMap[fieldType as keyof typeof requiredFieldMap];
    if (!config) return false;

    // Always check specific recipient assignments (since we now assign recipients in template mode)
    if (config.recipientIndex !== undefined) {
      return fields.some(field => 
        field.type === config.type && 
        field.recipientIndex === config.recipientIndex
      );
    }

    // For document fields with specific labels, check both type and label
    if (config.label) {
      return fields.some(field => 
        field.type === config.type && 
        field.fieldMeta?.label === config.label
      );
    }

    // Fallback: just check if the field type exists
    return fields.some(field => field.type === config.type);
  };

  if (!pdfFile && workflowState === 'template') {
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

  // Show success screen if step completed and no onFinish callback
  if (stepCompleted && !onFinish) {
    const stepNames = {
      'template': 'Template Creation',
      'document': 'Document Creation', 
      'signer1': 'Signer 1',
      'signer2': 'Signer 2',
      'completed': 'Document Completion'
    };
    const stepName = stepNames[workflowState] || workflowState;

    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-md mx-auto p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepName} Finished</h2>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ Success
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pdfEditorContainerRef} className="flex flex-col bg-gray-50" style={{ height: contentHeight }}>
      {/* Ghost cursor for field placement */}
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
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-96 bg-[#e7f0f0] border-r border-gray-200 overflow-y-auto overflow-x-hidden max-h-screen">
        <div className="p-4">
          {/* Use custom sidebar content if provided, otherwise use default */}
          {customSidebarContent ? (
            customSidebarContent(workflowState, renderDefaultSidebarContent())
          ) : (
            renderDefaultSidebarContent()
          )}
        </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col min-h-0">

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto px-6 pb-6 max-h-screen">
          {/* Header for template creation */}
          {workflowState === 'template' && listingAddress && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900">
                Create {templateType === 'lease' ? 'Lease' : 'Addendum'} Template for {listingAddress}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Add fields and configure signing requirements for this template
              </p>
            </div>
          )}
          
          <PDFViewer 
            file={pdfFile} 
            onPageClick={handlePageClick}
            pageWidth={pageWidth}
            isFieldPlacementMode={!!selectedField && (interactionMode === 'dragging' || interactionMode === 'click-to-place')}
          >
            {/* Helper function to determine if a field should be shown for renter (signer2) */}
            {fields.filter((field) => {
              // For signer2 (renter), filter fields to show only what's needed
              if (workflowState === 'signer2') {
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
              if (workflowState === 'template' || workflowState === 'document') {
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
                    active={field.formId === activeFieldId}
                    pageElement={pageElement}
                    signedValue={useSignedFieldsStore.getState().signedFields[field.formId]}
                    showValues={workflowState === 'document'} // Show values in document mode
                    canRemove={canRemoveField(field.formId)} // Check if field can be removed
                  />
                );
              }
              
              // During signing, show signable fields
              if (workflowState === 'signer1' || workflowState === 'signer2') {
                const currentSignerIndex = workflowState === 'signer1' ? 0 : 1;
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
              
              // During completion, show read-only signed fields
              return (
                <SignableField
                  key={field.formId}
                  field={field}
                  recipient={recipient}
                  onSign={() => {}} // No signing allowed
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
            })}
          </PDFViewer>
        </div>
        </div>
      </div>

      {/* Footer Controls - Fixed at bottom */}
      {showFooter && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40" style={{ height: '80px' }}>
          <div className="flex items-center justify-between">
            {/* Left side - Status info */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{fields.length}</span> fields • 
                <span className="font-medium"> {recipients.length}</span> recipients
              </div>
              {/* Step indicators removed since components are isolated */}
            </div>

            {/* Right side - Action buttons */}
            {!hideFooterControls && (
              <div className="flex items-center gap-3">
            {/* Template state controls */}
            {workflowState === 'template' && (
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
            {workflowState === 'document' && (
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
            {(workflowState === 'signer1' || workflowState === 'signer2') && (
              <>
                <div className="text-xs text-gray-500">
                  {(() => {
                    const currentSignerIndex = workflowState === 'signer1' ? 0 : 1;
                    
                    console.group('🏷️ DEBUG: Footer Field Count Calculation');
                    console.log('Workflow state:', workflowState, 'Current signer index:', currentSignerIndex);
                    console.log('Total fields in document:', fields.length);
                    
                    // For signer2 (renter), only count SIGNATURE/INITIALS fields (consistent with display filtering)
                    const signerFields = workflowState === 'signer2' 
                      ? fields.filter(f => {
                          console.log(`Field ${f.formId}: recipientIndex=${f.recipientIndex}, type=${typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || 'unknown')}`);
                          // For renter, only count their signature/initial fields
                          if (f.recipientIndex === 1) {
                            const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                            const isSignatureOrInitial = fieldType === 'SIGNATURE' || fieldType === 'INITIALS';
                            console.log(`  -> Renter field, isSignatureOrInitial=${isSignatureOrInitial}`);
                            return isSignatureOrInitial;
                          }
                          console.log(`  -> Not renter field (recipientIndex ${f.recipientIndex})`);
                          return false;
                        })
                      : fields.filter(f => {
                          console.log(`Field ${f.formId}: recipientIndex=${f.recipientIndex}, matches currentSigner=${f.recipientIndex === currentSignerIndex}`);
                          return f.recipientIndex === currentSignerIndex;
                        });
                    
                    console.log('Filtered signer fields:', signerFields.length, signerFields.map(f => ({
                      id: f.formId,
                      type: typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || 'unknown'),
                      recipientIndex: f.recipientIndex
                    })));
                    
                    const signatures = signerFields.filter(f => {
                      const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                      return fieldType === 'SIGNATURE';
                    });
                    const initials = signerFields.filter(f => {
                      const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                      return fieldType === 'INITIALS';
                    });
                    
                    console.log('Signatures found:', signatures.length, signatures.map(f => f.formId));
                    console.log('Initials found:', initials.length, initials.map(f => f.formId));
                    
                    const currentSignedFields = useSignedFieldsStore.getState().signedFields;
                    const pendingSignatures = signatures.filter(f => {
                      const isSigned = !!currentSignedFields[f.formId];
                      console.log(`Signature ${f.formId}: signed=${isSigned}, value=${currentSignedFields[f.formId]}`);
                      return !isSigned;
                    }).length;
                    const pendingInitials = initials.filter(f => {
                      const isSigned = !!currentSignedFields[f.formId];
                      console.log(`Initial ${f.formId}: signed=${isSigned}, value=${currentSignedFields[f.formId]}`);
                      return !isSigned;
                    }).length;
                    
                    console.log('Final counts: pendingSignatures=', pendingSignatures, ', pendingInitials=', pendingInitials);
                    console.groupEnd();
                    
                    const parts = [];
                    if (pendingSignatures > 0) {
                      parts.push(`${pendingSignatures} pending signature${pendingSignatures !== 1 ? 's' : ''}`);
                    }
                    if (pendingInitials > 0) {
                      parts.push(`${pendingInitials} pending initial${pendingInitials !== 1 ? 's' : ''}`);
                    }
                    
                    const finalText = parts.length > 0 ? parts.join(' • ') : 'All fields completed';
                    console.log('🏷️ Final footer text should be:', finalText);
                    console.log('🏷️ If you see "0 of 18" instead, something else is overriding this text');
                    
                    return finalText;
                  })()}
                </div>
                <BrandButton 
                  onClick={handleSigningAction}
                  size="sm"
                  spinOnClick={getUnsignedFields(useSignedFieldsStore.getState().signedFields).length === 0}
                >
                  {getUnsignedFields(useSignedFieldsStore.getState().signedFields).length === 0 ? 'Save and Send' : 'Next Action'}
                </BrandButton>
              </>
            )}

            {/* Completion state controls */}
            {workflowState === 'completed' && (
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

      {/* Missing Required Fields Dialog */}
      <BrandModal 
        isOpen={showMissingFieldsDialog}
        onOpenChange={setShowMissingFieldsDialog}
        className="max-w-md"
        triggerButton={<div style={{ display: 'none' }} />}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Required Fields Missing
          </h2>
          <p className="text-gray-600 mb-4">
            Please place all required lease fields before saving your template.
          </p>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Missing fields:</h3>
            <ul className="space-y-1">
              {missingFields.map((field) => (
                <li key={field} className="text-sm text-red-600 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  {field.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <BrandButton 
              onClick={() => setShowMissingFieldsDialog(false)}
              className="px-6"
            >
              Got it
            </BrandButton>
          </div>
        </div>
      </BrandModal>
    </div>
  );
};

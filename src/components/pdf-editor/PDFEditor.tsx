'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Eye, EyeOff, ChevronDown } from 'lucide-react';

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
import { createFieldAtPosition, getPage, isWithinPageBounds, getFieldBounds } from './field-utils';
import { PdfTemplate } from '@prisma/client';
import { handleSignerCompletion } from '@/app/actions/documents';

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
  templateType?: 'lease' | 'addendum' | 'disclosure' | 'other';
  isMergedDocument?: boolean;
  mergedTemplateIds?: string[];
  matchDetails?: MatchDetails;
  housingRequestId?: string;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
  onDocumentCreated?: (documentId: string) => void;
  customSidebarContent?: (workflowState: WorkflowState, defaultContent: JSX.Element) => JSX.Element;
}

export const PDFEditor: React.FC<PDFEditorProps> = ({ 
  initialWorkflowState = 'selection', 
  initialPdfFile, 
  initialFields,
  initialRecipients,
  templateType = 'lease',
  isMergedDocument = false,
  mergedTemplateIds,
  matchDetails,
  housingRequestId,
  onSave, 
  onCancel,
  onFinish,
  onDocumentCreated,
  customSidebarContent
}) => {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(initialPdfFile || null);
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients || []);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [pendingFieldLabel, setPendingFieldLabel] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFieldLabels, setShowFieldLabels] = useState(true);
  const [pageWidth, setPageWidth] = useState(800);
  const [workflowState, setWorkflowState] = useState<WorkflowState>(initialWorkflowState);
  const [signedFields, setSignedFields] = useState<Record<string, any>>({});
  
  // Debug log for signedFields changes
  useEffect(() => {
    console.log('🔍 PDFEditor - signedFields updated:', signedFields);
    Object.entries(signedFields).forEach(([fieldId, value]) => {
      console.log(`🔍 PDFEditor - signedField[${fieldId}]:`, {
        value,
        valueType: typeof value,
        valueKeys: value && typeof value === 'object' ? Object.keys(value) : null
      });
    });
  }, [signedFields]);
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
  
  // Accordion states
  const [accordionStates, setAccordionStates] = useState({
    documentInfo: true,
    recipients: true, 
    fieldTypes: true,
    requiredFields: true
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
        console.log('📝 Initializing signedFields with pre-filled values:', preFilledValues);
        setSignedFields(preFilledValues);
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

    // Update signed fields using functional update
    setSignedFields(currentSignedFields => {
      const newSignedFields = { ...currentSignedFields };
      
      // Map field types to match details values
      fields.forEach(field => {
        if (field.type === 'NAME') {
          if (field.recipientIndex === 0 || field.signerEmail?.includes('host')) {
            newSignedFields[field.formId] = matchDetails.hostName;
          } else if (field.recipientIndex === 1 || field.signerEmail?.includes('renter')) {
            newSignedFields[field.formId] = matchDetails.primaryRenterName;
          }
        } else if (field.type === 'EMAIL') {
          if (field.recipientIndex === 0 || field.signerEmail?.includes('host')) {
            newSignedFields[field.formId] = matchDetails.hostEmail;
          } else if (field.recipientIndex === 1 || field.signerEmail?.includes('renter')) {
            newSignedFields[field.formId] = matchDetails.primaryRenterEmail;
          }
        } else if (field.type === 'NUMBER' || field.type === 'TEXT') {
          // Auto-populate likely rent fields
          const fieldLabel = field.fieldMeta?.label?.toLowerCase() || '';
          if (fieldLabel.includes('rent') || fieldLabel.includes('price') || fieldLabel.includes('amount')) {
            newSignedFields[field.formId] = matchDetails.monthlyPrice;
          } else if (fieldLabel.includes('address') || fieldLabel.includes('property') || fieldLabel.includes('location')) {
            newSignedFields[field.formId] = matchDetails.propertyAddress;
          }
        } else if (field.type === 'DATE') {
          const fieldLabel = field.fieldMeta?.label?.toLowerCase() || '';
          if (fieldLabel.includes('start') || fieldLabel.includes('begin')) {
            newSignedFields[field.formId] = matchDetails.startDate;
          } else if (fieldLabel.includes('end') || fieldLabel.includes('expire')) {
            newSignedFields[field.formId] = matchDetails.endDate;
          }
        }
      });

      return newSignedFields;
    });
  }, [fields]);

  // Initialize mandatory recipients when starting
  useEffect(() => {
    if (recipients.length === 0) {
      const mandatoryRecipients: Recipient[] = [
        {
          id: 'host-recipient',
          name: '[Host Name]', // Template placeholder
          email: 'host@template.placeholder',
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
  }, [recipients.length]);

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
      setPdfFile(acceptedFiles[0]);
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
    const customFieldTypes = [FieldType.TEXT, FieldType.NUMBER, FieldType.EMAIL, FieldType.NAME, FieldType.CHECKBOX, FieldType.DROPDOWN];
    
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
            ...(selectedField === FieldType.NUMBER && pendingFieldLabel === 'Monthly Rent' && {
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
            ...(selectedField === FieldType.DATE && (pendingFieldLabel === 'Start Date' || pendingFieldLabel === 'End Date') && {
              required: true
            })
          }
        };
        setFields([...fields, fieldWithMetadata]);
        setActiveFieldId(fieldWithMetadata.formId);
        console.log('✅ Required field added directly with metadata:', fieldWithMetadata);
      } else {
        // Non-custom fields (signatures, initials, etc.)
        setFields([...fields, newField]);
        setActiveFieldId(newField.formId);
        console.log('✅ Field creation completed, setting states to cleanup');
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

    setFields(fields.map(f => 
      f.formId === formId 
        ? { ...f, pageX, pageY, pageWidth: fieldPageWidth, pageHeight: fieldPageHeight }
        : f
    ));
  };

  // Check if a field is template-enforced (based on the required fields map)
  const isTemplateEnforcedField = (field: FieldFormType) => {
    const requiredFieldMap = {
      'host-signature': { type: FieldType.SIGNATURE, recipientIndex: 0 },
      'host-name': { type: FieldType.NAME, recipientIndex: 0 },
      'renter-signature': { type: FieldType.SIGNATURE, recipientIndex: 1 },
      'renter-name': { type: FieldType.NAME, recipientIndex: 1 },
      'monthly-rent': { type: FieldType.NUMBER, label: 'Monthly Rent' },
      'start-date': { type: FieldType.DATE, label: 'Start Date' },
      'end-date': { type: FieldType.DATE, label: 'End Date' }
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
    
    setFields(fields.filter((field) => field.formId !== formId));
    if (activeFieldId === formId) {
      setActiveFieldId(null);
    }
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
  const saveTemplateAndCreateDocument = async () => {
    if (!pdfFile) {
      alert('Please upload a PDF file first.');
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
        title: pdfFile.name.replace('.pdf', ' Template') || 'PDF Template',
        description: `Template created from ${pdfFile.name}`,
        type: templateType,
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
      
      alert(`✅ Template saved successfully!\n\n📄 PDF: ${uploadResult.fileName}\n🎯 Fields: ${fields.length}\n👥 Recipients: ${recipients.length}\n🆔 Template ID: ${template.id}`);
      
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
      alert(errorMessage);
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
        alert('Unable to create document. Please start over from template selection.');
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
      alert('Failed to start signing workflow: ' + error.message);
    }
  };

  // Save signer progress for async workflow (doesn't auto-transition)
  const saveSignerProgressAsync = async (signerIndex: number) => {
    const documentId = sessionStorage.getItem('currentDocumentId');
    if (!documentId) {
      alert('Document not found. Please start over.');
      return;
    }

    console.log(`📋 Saving progress for signer ${signerIndex + 1}, document: ${documentId}`);

    try {
      // Save all signed fields for this signer
      const signerFields = fields.filter(f => f.recipientIndex === signerIndex);
      console.log(`💾 Saving ${signerFields.length} field values for signer ${signerIndex + 1}`);
      
      for (const field of signerFields) {
        const fieldValue = signedFields[field.formId];
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
      alert(`✅ ${signerName} has completed signing!\n\n${signerIndex === 0 ? 'Document is now ready for Signer 2.' : 'Document is fully signed and complete.'}`);
      
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
      alert('Failed to save signer progress. Please try again.');
    }
  };

  // Step 3/4 → Next: Save signer progress (legacy synchronous version)
  const saveSignerProgressAndContinue = async (signerIndex: number) => {
    const documentId = sessionStorage.getItem('currentDocumentId');
    if (!documentId) {
      alert('Document not found. Please start over.');
      return;
    }

    try {
      // Save all signed fields for this signer
      const signerFields = fields.filter(f => f.recipientIndex === signerIndex);
      
      for (const field of signerFields) {
        const fieldValue = signedFields[field.formId];
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
      alert('Failed to save signer progress. Please try again.');
    }
  };

  // Complete signing workflow
  const completeSigning = async () => {
    const documentId = sessionStorage.getItem('currentDocumentId');
    if (!documentId) {
      alert('Document not found. Please start over.');
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
      alert('Failed to complete signing. Please try again.');
    }
  };

  // Save template functionality (manual save)
  const saveTemplate = async () => {
    await saveTemplateAndCreateDocument();
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
        alert('✅ Document saved as draft successfully!');
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
        alert('✅ Document updated successfully!');
      } else {
        throw new Error('No template or document ID found. Please start from template creation.');
      }
      
    } catch (error) {
      console.error('❌ Error in saveDocument:', error);
      alert('Failed to save document: ' + error.message);
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
      setSignedFields({});
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">PDF Editor</h1>
            <div className="text-sm text-gray-500 mt-1">
              {workflowState === 'template' && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Template Design
                </span>
              )}
              {workflowState === 'document' && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Create Document
                </span>
              )}
              {workflowState === 'signer1' && `Signing as ${recipients[0]?.name}`}
              {workflowState === 'signer2' && `Signing as ${recipients[1]?.name}`}
              {workflowState === 'completed' && 'Document Complete'}
            </div>
          </div>
        </div>

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
                          {signedFields[field.formId] ? (
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
          return { ...r, name: 'John Smith', email: 'host@host.com' };
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
        
        setSignedFields(preFilledFields);
        console.log('✅ Pre-filled fields:', preFilledFields);
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
      alert('❌ Failed to load template: ' + error.message);
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
        
        console.log('📝 All existing signed fields loaded:', existingSignedFields);
        setSignedFields(existingSignedFields);
      } else {
        console.log('📝 No existing signed fields found, starting fresh');
        setSignedFields({});
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
      alert('❌ Failed to load document: ' + error.message);
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
        if (fields.length === 0) {
          alert('Please add some fields to your template first!');
          return;
        }
        
        // For lease templates, check if all required fields are present
        if (templateType === 'lease') {
          const requiredFieldTypes = ['host-signature', 'host-name', 'renter-signature', 'renter-name', 'monthly-rent', 'start-date', 'end-date'];
          const missingRequiredFields = requiredFieldTypes.filter(fieldType => !getRequiredFieldStatus(fieldType));
          
          if (missingRequiredFields.length > 0) {
            alert(`Please place all required lease fields before saving. Missing: ${missingRequiredFields.join(', ')}`);
            return;
          }
        }
        
        // Save the template
        await saveTemplate();
        // Call onSave if provided
        if (onSave && pdfFile) {
          onSave({ fields, recipients, pdfFile });
        }
        break;
        
      case 'document':
        if (fields.length === 0) {
          alert('Please add some fields before finishing!');
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
              
              // Transition to signing workflow
              setWorkflowState('signer1');
            }
          } catch (error) {
            console.error('Error in onSave callback:', error);
            alert('Failed to save document: ' + error.message);
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
          alert('Failed to create document: ' + error.message);
          setIsCreatingDocument(false);
          return;
        }
        break;
        
      case 'signer1':
      case 'signer2':
        // Check if all required fields are signed
        const currentSignerIndex = workflowState === 'signer1' ? 0 : 1;
        const signerFields = fields.filter(f => f.recipientIndex === currentSignerIndex && ['SIGNATURE', 'INITIALS'].includes(f.type));
        const unSignedFields = signerFields.filter(f => !signedFields[f.formId]);
        if (unSignedFields.length > 0) {
          alert('Please complete all required fields before finishing!');
          return;
        }
        
        try {
          // Save signing progress to the backend (always use proper signing workflow)
          console.log(`🖊️ Saving signing progress for signer ${currentSignerIndex + 1}...`);
          await saveSignerProgressAsync(currentSignerIndex);
          
          // Call server action to handle notifications and booking creation
          const documentId = sessionStorage.getItem('currentDocumentId');
          if (documentId) {
            console.log(`📤 Calling server action for signer completion...`);
            const result = await handleSignerCompletion(documentId, currentSignerIndex, recipients, housingRequestId);
            if (!result.success) {
              console.error('❌ Server action failed:', result.error);
            }
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
          alert('Failed to save signing progress: ' + error.message);
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

  // Navigation functions removed - components are now isolated

  // Get current signer for signing workflow
  const getCurrentSigner = () => {
    if (workflowState === 'signer1') return recipients[0];
    if (workflowState === 'signer2') return recipients[1];
    return null;
  };

  // Get appropriate field label based on type and recipient
  const getFieldLabel = (field: FieldFormType) => {
    if (field.type === 'SIGNATURE') {
      return field.recipientIndex === 0 ? 'Host Signature' : 'Primary Renter Signature';
    } else if (field.type === 'INITIALS') {
      return field.recipientIndex === 0 ? 'Host Initials' : 'Primary Renter Initials';
    }
    return FRIENDLY_FIELD_TYPE[field.type];
  };

  // Get unsigned fields for current signer
  const getUnsignedFields = () => {
    const currentSignerIndex = workflowState === 'signer1' ? 0 : 1;
    return fields.filter(f => f.recipientIndex === currentSignerIndex && !signedFields[f.formId] && ['SIGNATURE', 'INITIALS'].includes(f.type));
  };

  // Navigate to next unsigned field and flash it
  const navigateToNextField = () => {
    console.log('🎯 navigateToNextField: Starting navigation');
    const unsignedFields = getUnsignedFields();
    console.log('🎯 navigateToNextField: Found unsigned fields:', unsignedFields.length);
    
    if (unsignedFields.length === 0) {
      console.log('🎯 navigateToNextField: No unsigned fields, returning');
      return;
    }

    const nextField = unsignedFields[0];
    console.log('🎯 navigateToNextField: Next field:', nextField);
    
    // Find the field element first
    const fieldElement = document.querySelector(`[data-field-id="${nextField.formId}"]`) as HTMLElement;
    console.log('🎯 navigateToNextField: Field element found:', !!fieldElement);
    
    if (fieldElement) {
      // Scroll directly to the field and center it in the viewport
      fieldElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
        inline: 'center' 
      });
      console.log('🎯 navigateToNextField: Scrolled to field');
      
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
        console.log('🎯 navigateToNextField: Applied first flash');
        
        setTimeout(() => {
          fieldElement.style.backgroundColor = originalBg || '';
          fieldElement.style.boxShadow = originalBoxShadow || '';
          console.log('🎯 navigateToNextField: Removed first flash');
          
          setTimeout(() => {
            fieldElement.style.backgroundColor = '#0B6E6E';
            fieldElement.style.boxShadow = '0 0 20px rgba(11, 110, 110, 0.5)';
            console.log('🎯 navigateToNextField: Applied second flash');
            
            setTimeout(() => {
              fieldElement.style.backgroundColor = originalBg || '';
              fieldElement.style.boxShadow = originalBoxShadow || '';
              fieldElement.style.transition = originalTransition || '';
              console.log('🎯 navigateToNextField: Completed flashing');
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

  // Handle signing button click
  const handleSigningAction = async () => {
    const unsignedFields = getUnsignedFields();
    
    if (unsignedFields.length > 0) {
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
    
    setSignedFields(prev => {
      const newSignedFields = {
        ...prev,
        [fieldId]: value
      };
      
      // Auto-populate sign date fields when signature is signed
      if (field && field.type === FieldType.SIGNATURE && value) {
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        // Find corresponding sign date field for this recipient
        const signDateField = fields.find(f => 
          f.type === FieldType.SIGN_DATE && 
          f.recipientIndex === field.recipientIndex
        );
        
        if (signDateField && !prev[signDateField.formId]) {
          newSignedFields[signDateField.formId] = currentDate;
        }
      }
      
      return newSignedFields;
    });
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

  // Check if required fields are placed
  const getRequiredFieldStatus = (fieldType: string) => {
    const requiredFieldMap = {
      'host-signature': { type: FieldType.SIGNATURE, recipientIndex: 0 },
      'host-name': { type: FieldType.NAME, recipientIndex: 0 },
      'renter-signature': { type: FieldType.SIGNATURE, recipientIndex: 1 },
      'renter-name': { type: FieldType.NAME, recipientIndex: 1 },
      'monthly-rent': { type: FieldType.NUMBER, label: 'Monthly Rent' },
      'start-date': { type: FieldType.DATE, label: 'Start Date' },
      'end-date': { type: FieldType.DATE, label: 'End Date' }
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
    <div ref={pdfEditorContainerRef} className="flex flex-col bg-gray-50" style={{ height: 'calc(100vh - 80px)' }}>
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
        <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto overflow-x-hidden">
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
        <div className="flex-1 flex flex-col">

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto p-6">
          <PDFViewer 
            file={pdfFile} 
            onPageClick={handlePageClick}
            pageWidth={pageWidth}
            isFieldPlacementMode={!!selectedField && (interactionMode === 'dragging' || interactionMode === 'click-to-place')}
          >
            {fields.map((field) => {
              const pageElement = pageElements.get(field.pageNumber);
              const recipient = recipients.find(r => r.id === field.signerEmail);
              
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
                    active={field.formId === activeFieldId}
                    pageElement={pageElement}
                    signedValue={signedFields[field.formId]}
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
                    isSigned={!!signedFields[field.formId]}
                    signedValue={signedFields[field.formId]}
                    isForCurrentSigner={field.recipientIndex === currentSignerIndex}
                    pageElement={pageElement}
                    savedSignatures={savedSignatures}
                    onSaveSignature={saveSignature}
                    onDeleteSignature={deleteSignature}
                    onSetDefaultSignature={setDefaultSignature}
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
                  isSigned={!!signedFields[field.formId]}
                  signedValue={signedFields[field.formId]}
                  isForCurrentSigner={false}
                  pageElement={pageElement}
                  savedSignatures={savedSignatures}
                  onSaveSignature={saveSignature}
                  onDeleteSignature={deleteSignature}
                  onSetDefaultSignature={setDefaultSignature}
                />
              );
            })}
          </PDFViewer>
        </div>
        </div>
      </div>

      {/* Footer Controls - Fixed at bottom */}
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
          <div className="flex items-center gap-3">
            {/* Template state controls */}
            {workflowState === 'template' && (
              <>
                <BrandButton 
                  onClick={completeCurrentStep}
                  disabled={templateType !== 'addendum' && fields.length === 0}
                  size="sm"
                  spinOnClick={true}
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
                  {fields.filter(f => f.recipientIndex === (workflowState === 'signer1' ? 0 : 1)).filter(f => ['SIGNATURE', 'INITIALS'].includes(f.type)).filter(f => signedFields[f.formId]).length} of{' '}
                  {fields.filter(f => f.recipientIndex === (workflowState === 'signer1' ? 0 : 1)).filter(f => ['SIGNATURE', 'INITIALS'].includes(f.type)).length} signature fields signed
                </div>
                <BrandButton 
                  onClick={handleSigningAction}
                  size="sm"
                  spinOnClick={getUnsignedFields().length === 0}
                >
                  {getUnsignedFields().length === 0 ? 'Save and Send' : 'Next Action'}
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
        </div>
      </div>
      
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
    </div>
  );
};
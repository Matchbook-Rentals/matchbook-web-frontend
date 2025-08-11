'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Save, Undo2, Redo2, Eye, EyeOff } from 'lucide-react';

import { PDFViewer, OnPDFViewerPageClick } from './PDFViewer';
import { FieldItem } from './FieldItem';
import { FieldSelector } from './FieldSelector';
import { SignableField } from './SignableField';
import { RecipientManager, type Recipient } from './RecipientManager';
import { TemplateBrowser } from './TemplateBrowser';
import { DocumentTemplateSelector } from './DocumentTemplateSelector';
import { DocumentSelector } from './DocumentSelector';
import { FieldFormType, FieldType, ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING, FRIENDLY_FIELD_TYPE } from './types';
import { createFieldAtPosition, getPage, isWithinPageBounds, getFieldBounds } from './field-utils';
import { PdfTemplate } from '@prisma/client';

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

// Hook for undo/redo functionality
const useHistory = <T,>(initialState: T) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = (newState: T) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return {
    state: history[currentIndex],
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
};

// Workflow states for the signing process
type WorkflowState = 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed';

export const PDFEditor: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [pendingFieldLabel, setPendingFieldLabel] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFieldLabels, setShowFieldLabels] = useState(true);
  const [pageWidth, setPageWidth] = useState(800);
  const [workflowState, setWorkflowState] = useState<WorkflowState>('selection');
  const [signedFields, setSignedFields] = useState<Record<string, any>>({});
  
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
  
  // Ghost cursor state for field placement
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const fieldBounds = useRef({ width: 0, height: 0 });

  // Use history hook for undo/redo
  const { state: fields, setState: setFields, undo, redo, canUndo, canRedo } = useHistory<FieldFormType[]>([]);

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

  // Mouse tracking for ghost cursor and drag behavior
  useEffect(() => {
    if (!selectedField || !isDragging) {
      return;
    }

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
      // Only cancel if mousedown is outside PDF area AND we're actively dragging
      const pdfArea = document.querySelector('[data-pdf-viewer-page]');
      if (!pdfArea || !pdfArea.contains(event.target as Node)) {
        cancelFieldPlacement();
      }
    };

    // Always add mousemove and keydown immediately
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', onKeyDown);
    
    // Add mousedown listener with a small delay to avoid canceling immediately after button click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', onMouseDown);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [selectedField, isDragging]);

  // Dual interaction mode detection
  useEffect(() => {
    if (interactionMode === 'idle') return;

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
        // Fix: Find the actual page element under the mouse (works for any page, not just page 1)
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

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);  
      document.removeEventListener('keydown', handleGlobalKeyDown);
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
    
    setFields([...fields, newField]);
    setActiveFieldId(newField.formId);
    
    console.log('✅ Field creation completed, setting states to cleanup');

    // Open settings for complex fields
    if (ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING.includes(selectedField)) {
      console.log('⚙️ Would open settings for:', newField);
    }

    console.log('🧹 Cleaning up states:', {
      selectedField: selectedField + ' → null',
      pendingFieldLabel: pendingFieldLabel + ' → null',
      isDragging: 'false',
      interactionMode: interactionMode + ' → idle',
      isMouseDown: 'false'
    });

    setSelectedField(null);
    setPendingFieldLabel(null);
    setIsDragging(false);
    setInteractionMode('idle');
    setIsMouseDown(false);
    
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

  // Remove field
  const removeField = (formId: string) => {
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
      console.log('✅ Upload successful:', {
        fileKey: uploadResult.fileKey,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize
      });

      // Step 2: Save template with annotations
      console.log('💾 STEP 2: Saving template with annotations...');
      const templateData = {
        title: pdfFile.name.replace('.pdf', ' Template') || 'PDF Template',
        description: `Template created from ${pdfFile.name}`,
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
      
      // If no document exists yet, create one from the current template
      if (!documentId && templateId) {
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

      // Update document with current progress and signed fields
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
          status: signerIndex === 0 ? 'AWAITING_SIGNER2' : 'COMPLETED',
          [`signer${signerIndex + 1}CompletedAt`]: new Date().toISOString()
        }),
      });

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
      
      // If no document exists yet, create one from the current template
      if (!documentId && templateId) {
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
          existingSignedFields[fieldValue.fieldId] = fieldValue.value;
          console.log(`📝 Loaded signed value for ${fieldValue.fieldId}: "${fieldValue.value}" (signer: ${fieldValue.signerIndex})`);
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

  // Workflow navigation with database persistence
  const proceedToNextStep = async () => {
    switch (workflowState) {
      case 'template':
        if (fields.length === 0) {
          alert('Please add some fields to your template first!');
          return;
        }
        
        // Step 1 → Step 2: Save template and create document
        await saveTemplateAndCreateDocument();
        break;
        
      case 'document':
        if (fields.length === 0) {
          alert('Please add some fields before proceeding to signing!');
          return;
        }
        
        // Step 2 → Step 3: Save document and start signing workflow
        await saveDocumentAndStartSigning();
        break;
        
      case 'signer1':
        // Step 3 → Async: Save signer 1 progress and return to selection
        await saveSignerProgressAsync(0);
        break;
        
      case 'signer2':
        // Step 4 → Complete: Save final signatures and complete
        await saveSignerProgressAndContinue(1);
        break;
    }
  };

  const goBackToEditing = () => {
    setWorkflowState('document');
    setSignedFields({});
  };

  const goBackToTemplate = () => {
    setWorkflowState('template');
    setRecipients([]);
    setSelectedRecipient(null);
    setSignedFields({});
  };

  // Get current signer for signing workflow
  const getCurrentSigner = () => {
    if (workflowState === 'signer1') return recipients[0];
    if (workflowState === 'signer2') return recipients[1];
    return null;
  };

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
      }, 1000);
      
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Template</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWorkflowState('selection')}
              >
                ← Back to Menu
              </Button>
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

  // Selection Screen
  if (workflowState === 'selection') {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-4xl mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF Document Workflow</h1>
              <p className="text-lg text-gray-600">Choose what you&apos;d like to do</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Create Template */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setWorkflowState('template')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Template</h3>
                  <p className="text-sm text-gray-600">Upload a PDF and add form fields</p>
                </CardContent>
              </Card>

              {/* Create Document */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setWorkflowState('document')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Save className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Document</h3>
                  <p className="text-sm text-gray-600">Choose a template to create a document</p>
                </CardContent>
              </Card>

              {/* Sign Document - Signer 1 */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
                console.log('🖱️ Sign (Signer 1) clicked');
                setPendingSignerType('signer1');
                setShowDocumentSelector(true);
                console.log('🖱️ States set - pendingSignerType: signer1, showDocumentSelector: true');
              }}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign (Signer 1)</h3>
                  <p className="text-sm text-gray-600">Sign as the first signer</p>
                </CardContent>
              </Card>

              {/* Sign Document - Signer 2 */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
                console.log('🖱️ Sign (Signer 2) clicked');
                setPendingSignerType('signer2');
                setShowDocumentSelector(true);
                console.log('🖱️ States set - pendingSignerType: signer2, showDocumentSelector: true');
              }}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign (Signer 2)</h3>
                  <p className="text-sm text-gray-600">Sign as the second signer</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Document Selector Modal for Selection Screen */}
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
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
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
            {(workflowState === 'template' || workflowState === 'document') && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWorkflowState('selection')}
                >
                  ← Menu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPdfFile(null);
                    setFields([]);
                    setRecipients([]);
                    setSelectedRecipient(null);
                    setActiveFieldId(null);
                    setSelectedField(null);
                    setWorkflowState('template');
                    setSignedFields({});
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  New PDF
                </Button>
              </div>
            )}
            {(workflowState === 'signer1' || workflowState === 'signer2') && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWorkflowState('selection')}
                >
                  ← Menu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goBackToEditing}
                >
                  ← Back to Setup
                </Button>
              </div>
            )}
          </div>

          {/* Workflow-specific content */}
          {workflowState === 'template' && (
            <>
              {/* Recipients - Now visible in template mode */}
              <div className="mb-6">
                <RecipientManager
                  recipients={recipients}
                  selectedRecipient={selectedRecipient}
                  onSelectRecipient={setSelectedRecipient}
                  onAddRecipient={addRecipient}
                  onRemoveRecipient={removeRecipient}
                />
              </div>

              {/* Required Fields Quick Add */}
              <Card className="mb-6">
                <CardContent className="p-3">
                  <h3 className="font-medium mb-3">Required Lease Fields</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs justify-start ${getRequiredFieldStatus('host-signature') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
                      onMouseDown={(e) => {
                        startFieldDetection(FieldType.SIGNATURE, 'host-recipient', e.nativeEvent as MouseEvent);
                      }}
                    >
                      {getRequiredFieldStatus('host-signature') ? '✓' : '+'} Host Signature
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs justify-start ${getRequiredFieldStatus('host-name') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
                      onMouseDown={(e) => {
                        startFieldDetection(FieldType.NAME, 'host-recipient', e.nativeEvent as MouseEvent);
                      }}
                    >
                      {getRequiredFieldStatus('host-name') ? '✓' : '+'} Host Name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs justify-start ${getRequiredFieldStatus('renter-signature') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
                      onMouseDown={(e) => {
                        startFieldDetection(FieldType.SIGNATURE, 'primary-renter-recipient', e.nativeEvent as MouseEvent);
                      }}
                    >
                      {getRequiredFieldStatus('renter-signature') ? '✓' : '+'} Renter Signature
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs justify-start ${getRequiredFieldStatus('renter-name') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
                      onMouseDown={(e) => {
                        startFieldDetection(FieldType.NAME, 'primary-renter-recipient', e.nativeEvent as MouseEvent);
                      }}
                    >
                      {getRequiredFieldStatus('renter-name') ? '✓' : '+'} Renter Name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs justify-start ${getRequiredFieldStatus('monthly-rent') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
                      onMouseDown={(e) => {
                        startFieldDetection(FieldType.NUMBER, 'host-recipient', e.nativeEvent as MouseEvent, 'Monthly Rent');
                      }}
                    >
                      {getRequiredFieldStatus('monthly-rent') ? '✓' : '+'} Monthly Rent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs justify-start ${getRequiredFieldStatus('start-date') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
                      onMouseDown={(e) => {
                        startFieldDetection(FieldType.DATE, 'host-recipient', e.nativeEvent as MouseEvent, 'Start Date');
                      }}
                    >
                      {getRequiredFieldStatus('start-date') ? '✓' : '+'} Start Date
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs justify-start ${getRequiredFieldStatus('end-date') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
                      onMouseDown={(e) => {
                        startFieldDetection(FieldType.DATE, 'host-recipient', e.nativeEvent as MouseEvent, 'End Date');
                      }}
                    >
                      {getRequiredFieldStatus('end-date') ? '✓' : '+'} End Date
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Hold mouse down to start drag, release over PDF to place field
                  </p>
                </CardContent>
              </Card>

              {/* Field Selector for Template */}
              <div className="mb-6">
                <FieldSelector
                  selectedField={selectedField}
                  onSelectedFieldChange={(fieldType) => {
                    setSelectedField(fieldType);
                    setPendingFieldLabel(null); // Clear any pending label from required field buttons
                  }}
                  onStartDrag={(fieldType, mouseEvent) => {
                    const recipientToUse = selectedRecipient || recipients[0]?.id;
                    if (recipientToUse) {
                      startFieldDetection(fieldType, recipientToUse, mouseEvent);
                    }
                  }}
                  disabled={recipients.length === 0}
                />
              </div>

              {/* Template Stats */}
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Template Fields:</span>
                      <Badge variant="secondary">{fields.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </>
          )}

          {workflowState === 'document' && !pdfFile && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Document</h3>
                <p className="text-sm text-gray-600">Choose a template to create a new document from</p>
              </div>

              <DocumentTemplateSelector
                onLoadTemplate={loadTemplate}
                onClose={() => setWorkflowState('selection')}
              />
            </>
          )}

          {workflowState === 'document' && pdfFile && (
            <>
              {/* Real People & Document Values */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Document Information</h3>
                  
                  {/* People Section */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">People</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">Host Name</label>
                        <input 
                          type="text"
                          defaultValue="John Smith"
                          className="w-full text-sm border rounded px-2 py-1"
                          onChange={(e) => {
                            // Update recipient name and all host name fields
                            const newRecipients = recipients.map(r => 
                              r.role === 'HOST' ? { ...r, name: e.target.value } : r
                            );
                            setRecipients(newRecipients);
                            
                            // Update all host name fields
                            const newSignedFields = { ...signedFields };
                            fields.forEach(field => {
                              if (field.type === 'NAME' && (field.signerEmail?.includes('host') || field.recipientIndex === 0)) {
                                newSignedFields[field.formId] = e.target.value;
                              }
                            });
                            setSignedFields(newSignedFields);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Host Email</label>
                        <input 
                          type="email"
                          defaultValue="host@host.com"
                          className="w-full text-sm border rounded px-2 py-1"
                          onChange={(e) => {
                            const newRecipients = recipients.map(r => 
                              r.role === 'HOST' ? { ...r, email: e.target.value } : r
                            );
                            setRecipients(newRecipients);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Renter Name</label>
                        <input 
                          type="text"
                          defaultValue="Jane Doe"
                          className="w-full text-sm border rounded px-2 py-1"
                          onChange={(e) => {
                            // Update recipient name and all renter name fields
                            const newRecipients = recipients.map(r => 
                              r.role === 'RENTER' ? { ...r, name: e.target.value } : r
                            );
                            setRecipients(newRecipients);
                            
                            // Update all renter name fields
                            const newSignedFields = { ...signedFields };
                            fields.forEach(field => {
                              if (field.type === 'NAME' && (field.signerEmail?.includes('renter') || field.recipientIndex === 1)) {
                                newSignedFields[field.formId] = e.target.value;
                              }
                            });
                            setSignedFields(newSignedFields);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Renter Email</label>
                        <input 
                          type="email"
                          defaultValue="renter@renter.com"
                          className="w-full text-sm border rounded px-2 py-1"
                          onChange={(e) => {
                            const newRecipients = recipients.map(r => 
                              r.role === 'RENTER' ? { ...r, email: e.target.value } : r
                            );
                            setRecipients(newRecipients);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lease Details Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Lease Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">Monthly Rent</label>
                        <input 
                          type="text"
                          defaultValue="2,500.00"
                          className="w-full text-sm border rounded px-2 py-1"
                          onChange={(e) => {
                            // Update any rent fields
                            const newSignedFields = { ...signedFields };
                            fields.forEach(field => {
                              if (field.type === 'TEXT' || field.type === 'NUMBER') {
                                // You could add more sophisticated field matching here
                                if (field.pageY < 50) { // Top of page fields
                                  newSignedFields[field.formId] = e.target.value;
                                }
                              }
                            });
                            setSignedFields(newSignedFields);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Start Date</label>
                        <input 
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                          className="w-full text-sm border rounded px-2 py-1"
                          onChange={(e) => {
                            const newSignedFields = { ...signedFields };
                            fields.forEach(field => {
                              if (field.type === 'DATE' && field.pageY < 50) {
                                newSignedFields[field.formId] = e.target.value;
                              }
                            });
                            setSignedFields(newSignedFields);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">End Date</label>
                        <input 
                          type="date"
                          defaultValue={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="w-full text-sm border rounded px-2 py-1"
                          onChange={(e) => {
                            const newSignedFields = { ...signedFields };
                            fields.forEach(field => {
                              if (field.type === 'DATE' && field.pageY >= 50) {
                                newSignedFields[field.formId] = e.target.value;
                              }
                            });
                            setSignedFields(newSignedFields);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recipients */}
              <div className="mb-6">
                <RecipientManager
                  recipients={recipients}
                  selectedRecipient={selectedRecipient}
                  onSelectRecipient={setSelectedRecipient}
                  onAddRecipient={addRecipient}
                  onRemoveRecipient={removeRecipient}
                />
              </div>

              {/* Field Selector */}
              <div className="mb-6">
                <FieldSelector
                  selectedField={selectedField}
                  onSelectedFieldChange={(fieldType) => {
                    setSelectedField(fieldType);
                    setPendingFieldLabel(null); // Clear any pending label from required field buttons
                  }}
                  onStartDrag={(fieldType, mouseEvent) => {
                    const recipientToUse = selectedRecipient || recipients[0]?.id;
                    if (recipientToUse) {
                      startFieldDetection(fieldType, recipientToUse, mouseEvent);
                    }
                  }}
                  disabled={recipients.length === 0}
                />
              </div>

              {/* Document Stats */}
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Recipients:</span>
                      <Badge variant="secondary">{recipients.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Fields:</span>
                      <Badge variant="secondary">{fields.length}</Badge>
                    </div>
                    {selectedRecipientData && (
                      <div className="flex justify-between">
                        <span>Selected:</span>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedRecipientData.color }}
                          />
                          <span className="text-xs">{selectedRecipientData.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Signing interface for signer1 and signer2 */}
          {(workflowState === 'signer1' || workflowState === 'signer2') && (
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
                    {/* Data Validation */}
                    {validationStatus === 'validating' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        Validating document data...
                      </div>
                    )}
                    {validationStatus === 'valid' && fieldsValidated && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        Document data validated - {fields.length} fields loaded
                      </div>
                    )}
                    {validationStatus === 'invalid' && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">⚠</span>
                        </div>
                        Document validation failed - please reload
                      </div>
                    )}
                    
                    {/* Rendering Validation */}
                    {validationStatus === 'valid' && renderingStatus === 'checking' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        Checking field visibility...
                      </div>
                    )}
                    {renderingStatus === 'rendered' && fieldsRendered && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        All {fields.length} fields rendered and clickable
                      </div>
                    )}
                    {renderingStatus === 'failed' && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">⚠</span>
                        </div>
                        Some fields not visible - <button 
                          onClick={validateFieldRendering}
                          className="underline hover:no-underline"
                        >
                          retry validation
                        </button>
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
                      .filter(f => f.recipientIndex === (workflowState === 'signer1' ? 0 : 1))
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

          {/* Completion interface */}
          {workflowState === 'completed' && (
            <>
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">✓</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Document Complete!</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      All signers have completed their fields. You can now download the final signed document.
                    </p>
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFieldLabels(!showFieldLabels)}
                title="Toggle field labels"
              >
                {showFieldLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="ml-2 text-xs">Labels</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Zoom:</span>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setPageWidth(Math.max(400, pageWidth - 100))}
                title="Zoom out"
              >
                -
              </Button>
              <span className="text-sm w-16 text-center">{Math.round((pageWidth / 800) * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageWidth(Math.min(1200, pageWidth + 100))}
                title="Zoom in"
              >
                +
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <Button variant="outline" size="sm" onClick={saveTemplate} title="Save template">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" onClick={exportPDF} title="Export PDF">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto p-6">
          <PDFViewer 
            file={pdfFile} 
            onPageClick={handlePageClick}
            pageWidth={pageWidth}
            isFieldPlacementMode={!!selectedField && (interactionMode === 'dragging' || interactionMode === 'click-to-place')}
          >
            {fields.map((field) => {
              const pageElement = document.querySelector(`[data-pdf-viewer-page][data-page-number="${field.pageNumber}"]`) as HTMLElement;
              const recipient = recipients.find(r => r.id === field.signerEmail);
              
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
                />
              );
            })}
          </PDFViewer>
        </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Status info */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{fields.length}</span> fields • 
              <span className="font-medium"> {recipients.length}</span> recipients
            </div>
            {(workflowState !== 'template' && workflowState !== 'document') && (
              <div className="text-sm">
                <span className="font-medium text-blue-600">
                  {workflowState === 'signer1' && 'Step 1 of 3: Signer 1'}
                  {workflowState === 'signer2' && 'Step 2 of 3: Signer 2'}
                  {workflowState === 'completed' && 'Step 3 of 3: Complete'}
                </span>
              </div>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            {/* Template state controls */}
            {workflowState === 'template' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowTemplateBrowser(true)} title="Load template">
                  <Upload className="w-4 h-4 mr-2" />
                  Load Template
                </Button>
                <Button variant="outline" size="sm" onClick={saveTemplate} title="Save template">
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
                <Button variant="outline" size="sm" onClick={exportPDF} title="Export template with field borders">
                  <Download className="w-4 h-4 mr-2" />
                  Export Template
                </Button>
                <Button 
                  onClick={proceedToNextStep}
                  disabled={fields.length === 0}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fields.length === 0 ? 'Add Fields First' : 'Create Document →'}
                </Button>
              </>
            )}

            {/* Document setup state controls */}
            {workflowState === 'document' && (
              <>
                <Button variant="outline" size="sm" onClick={goBackToTemplate}>
                  ← Back to Template
                </Button>
                <Button variant="outline" size="sm" onClick={saveDocument} title="Save document">
                  <Save className="w-4 h-4 mr-2" />
                  Save Document
                </Button>
                <Button variant="outline" size="sm" onClick={exportPDF} title="Export with field borders">
                  <Download className="w-4 h-4 mr-2" />
                  Export Draft
                </Button>
                <Button 
                  onClick={proceedToNextStep}
                  disabled={fields.length === 0}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {fields.length === 0 ? 'Add Fields First' : 'Start Signing →'}
                </Button>
              </>
            )}

            {/* Signing state controls */}
            {(workflowState === 'signer1' || workflowState === 'signer2') && (
              <>
                <Button variant="outline" size="sm" onClick={goBackToEditing}>
                  ← Back to Edit
                </Button>
                <div className="text-xs text-gray-500">
                  {fields.filter(f => f.recipientIndex === (workflowState === 'signer1' ? 0 : 1)).filter(f => signedFields[f.formId]).length} of{' '}
                  {fields.filter(f => f.recipientIndex === (workflowState === 'signer1' ? 0 : 1)).length} fields signed
                </div>
                <Button 
                  onClick={proceedToNextStep}
                  disabled={
                    !fieldsValidated || 
                    validationStatus !== 'valid' ||
                    !fieldsRendered ||
                    renderingStatus !== 'rendered' ||
                    fields.filter(f => f.recipientIndex === (workflowState === 'signer1' ? 0 : 1)).some(f => !signedFields[f.formId])
                  }
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {!fieldsValidated || validationStatus !== 'valid' 
                    ? 'Validating Data...' 
                    : !fieldsRendered || renderingStatus !== 'rendered'
                      ? 'Checking Field Visibility...'
                      : workflowState === 'signer1' 
                        ? 'Complete My Signing →' 
                        : 'Complete Document →'
                  }
                </Button>
              </>
            )}

            {/* Completion state controls */}
            {workflowState === 'completed' && (
              <>
                <Button variant="outline" size="sm" onClick={goBackToEditing}>
                  ← Start Over
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    if (!pdfFile) return;
                    try {
                      const arrayBuffer = await pdfFile.arrayBuffer();
                      const { exportPDFWithFields } = await import('@/lib/pdfExporter');
                      const exportedPdfBytes = await exportPDFWithFields(
                        arrayBuffer,
                        fields,
                        recipients,
                        signedFields,
                        { showFieldBorders: false, includeLabels: true, fieldOpacity: 1.0 }
                      );
                      const blob = new Blob([exportedPdfBytes], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    } catch (error) {
                      console.error('Error viewing PDF:', error);
                    }
                  }}
                  title="View final PDF in new tab"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View PDF
                </Button>
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
    </div>
  );
};
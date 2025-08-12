"use client";

import React, { useCallback, useState, useRef, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Undo2, Redo2, Eye, EyeOff } from 'lucide-react';
import { nanoid } from 'nanoid';

import { PDFViewer, OnPDFViewerPageClick } from '@/components/pdf-editor/PDFViewer';
import { FieldItem } from '@/components/pdf-editor/FieldItem';
import { SignableField } from '@/components/pdf-editor/SignableField';
import { FieldFormType, FieldType, FRIENDLY_FIELD_TYPE } from '@/components/pdf-editor/types';
import { createFieldAtPosition, getPage, isWithinPageBounds, getFieldBounds } from '@/components/pdf-editor/field-utils';

// Simplified recipient type for templates
interface TemplateRecipient {
  id: string;
  name: string;
  color: string;
  title: string;
  role: 'HOST' | 'RENTER';
}

interface TemplateEditorProps {
  initialPdfFile?: File;
  onSave?: (templateData: {
    fields: FieldFormType[];
    recipients: TemplateRecipient[];
    pdfFile: File;
  }) => void;
  onCancel?: () => void;
}

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

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const state = history[currentIndex];

  return { state, setState, undo, redo, canUndo, canRedo };
};

export function TemplateEditor({ initialPdfFile, onSave, onCancel }: TemplateEditorProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(initialPdfFile || null);
  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFieldLabels, setShowFieldLabels] = useState(true);
  const [pageWidth, setPageWidth] = useState(800);
  
  // Interaction mode state
  const [interactionMode, setInteractionMode] = useState<'idle' | 'detecting' | 'dragging' | 'click-to-place'>('idle');
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  
  // Ghost cursor state for field placement
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const fieldBounds = useRef({ width: 0, height: 0 });

  // Use history hook for undo/redo
  const { state: fields, setState: setFields, undo, redo, canUndo, canRedo } = useHistory<FieldFormType[]>([]);

  // Fixed recipients for lease templates
  const [recipients] = useState<TemplateRecipient[]>([
    {
      id: 'host-recipient',
      name: '[Host Name]',
      color: '#0B6E6E',
      title: 'Host',
      role: 'HOST'
    },
    {
      id: 'primary-renter-recipient',
      name: '[Primary Renter Name]',
      color: '#fb8c00',
      title: 'Primary Renter',
      role: 'RENTER'
    }
  ]);
  
  const [selectedRecipient, setSelectedRecipient] = useState<string>(recipients[0].id);

  // Movement threshold for detecting drag vs click
  const MOVEMENT_THRESHOLD = 10;

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

    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
      
      // Check if ghost field is within valid bounds
      const pdfContainer = document.querySelector('[data-pdf-container]');
      if (pdfContainer) {
        const rect = pdfContainer.getBoundingClientRect();
        const isWithin = isWithinPageBounds(
          e.clientX - rect.left,
          e.clientY - rect.top,
          fieldBounds.current.width,
          fieldBounds.current.height,
          pageWidth,
          rect.height
        );
        setIsFieldWithinBounds(isWithin);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [selectedField, isDragging, pageWidth]);



  // Handle PDF viewer clicks
  const handlePDFClick: OnPDFViewerPageClick = useCallback((event, pageNumber) => {
    if (!selectedField || interactionMode !== 'click-to-place') return;

    const selectedRecipientData = recipients.find(r => r.id === selectedRecipient);
    if (!selectedRecipientData) return;

    const newField = createFieldAtPosition(
      event,
      selectedField,
      pageNumber,
      selectedRecipientData.id,
      selectedRecipientData.color,
      pageWidth
    );

    if (newField && isWithinPageBounds(
      newField.x,
      newField.y,
      newField.width,
      newField.height,
      pageWidth,
      getPage(pageNumber)?.height || 0
    )) {
      setFields([...fields, newField]);
      setSelectedField(null);
      setInteractionMode('idle');
    }
  }, [selectedField, interactionMode, selectedRecipient, recipients, pageWidth, fields, setFields]);

  // Handle field selection from toolbar
  const handleFieldSelect = (fieldType: FieldType) => {
    setSelectedField(fieldType);
    setInteractionMode('click-to-place');
    setIsDragging(true);
  };

  // Handle save
  const handleSave = () => {
    if (pdfFile) {
      onSave?.({
        fields,
        recipients,
        pdfFile
      });
    }
  };

  // Field types available for templates
  const fieldTypes: FieldType[] = [
    'signature',
    'text', 
    'date',
    'checkbox'
  ];

  // If no PDF provided, show error or return to parent
  if (!pdfFile) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">No PDF Provided</h2>
            <p className="text-gray-600 mb-6">A PDF file is required to use the template editor.</p>
            {onCancel && (
              <Button onClick={onCancel} className="bg-[#3c8787] hover:bg-[#2d6666]">
                Go Back
              </Button>
            )}
          </CardContent>
        </Card>
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
            opacity: 0.7,
            borderRadius: '4px'
          }}
        />
      )}

      {/* Header with actions */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Template Editor</h1>
            <p className="text-sm text-gray-500">Add fields to create your template</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFieldLabels(!showFieldLabels)}
            >
              {showFieldLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-[#3c8787] hover:bg-[#2d6666]"
            >
              Save Template
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar with field tools */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Field Tools</h3>
            
            {/* Field Types */}
            <div className="space-y-2">
              {fieldTypes.map((fieldType) => (
                <Button
                  key={fieldType}
                  variant={selectedField === fieldType ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleFieldSelect(fieldType)}
                >
                  {FRIENDLY_FIELD_TYPE[fieldType]}
                </Button>
              ))}
            </div>

            {/* Recipient Selection */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Assign To</h4>
              <div className="space-y-2">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className={`p-2 rounded border cursor-pointer ${
                      selectedRecipient === recipient.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRecipient(recipient.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: recipient.color }}
                      />
                      <span className="text-sm font-medium">{recipient.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fields List */}
            {fields.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Fields ({fields.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {fields.map((field) => {
                    const recipient = recipients.find(r => r.id === field.recipientId);
                    return (
                      <FieldItem
                        key={field.formId}
                        field={field}
                        recipient={recipient}
                        isActive={activeFieldId === field.formId}
                        onClick={() => setActiveFieldId(field.formId)}
                        onUpdate={(updatedField) => {
                          setFields(fields.map(f => 
                            f.formId === updatedField.formId ? updatedField : f
                          ));
                        }}
                        onDelete={() => {
                          setFields(fields.filter(f => f.formId !== field.formId));
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100" data-pdf-container>
          <PDFViewer
            pdfFile={pdfFile}
            fields={fields}
            onPageClick={handlePDFClick}
            selectedFieldId={activeFieldId}
            onFieldClick={(fieldId) => setActiveFieldId(fieldId)}
            showFieldBorders={true}
            showFieldLabels={showFieldLabels}
            fieldOpacity={0.3}
            onPageWidthChange={setPageWidth}
          />
        </div>
      </div>
    </div>
  );
}
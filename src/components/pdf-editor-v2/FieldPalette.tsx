'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface FieldType {
  type: string;
  label: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
}

const FIELD_TYPES: FieldType[] = [
  { type: 'signature', label: 'Signature', icon: '✍️', defaultWidth: 200, defaultHeight: 60 },
  { type: 'text', label: 'Text Input', icon: 'T', defaultWidth: 200, defaultHeight: 40 },
  { type: 'date', label: 'Date', icon: '📅', defaultWidth: 150, defaultHeight: 40 },
  { type: 'checkbox', label: 'Checkbox', icon: '☐', defaultWidth: 40, defaultHeight: 40 },
  { type: 'dropdown', label: 'Dropdown', icon: '▼', defaultWidth: 200, defaultHeight: 40 },
];

interface FieldPaletteProps {
  onFieldSelect: (fieldType: FieldType) => void;
  selectedRecipient: string | null;
}

export const FieldPalette: React.FC<FieldPaletteProps> = ({ 
  onFieldSelect, 
  selectedRecipient 
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, fieldType: FieldType) => {
    e.dataTransfer.setData('fieldType', JSON.stringify(fieldType));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Fields</CardTitle>
        {!selectedRecipient && (
          <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            Please select a recipient first
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {FIELD_TYPES.map((fieldType) => (
            <Button
              key={fieldType.type}
              variant="outline"
              className={`w-full justify-start h-auto p-3 ${
                !selectedRecipient ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'
              }`}
              onClick={() => selectedRecipient && onFieldSelect(fieldType)}
              disabled={!selectedRecipient}
              draggable={!!selectedRecipient}
              onDragStart={(e) => selectedRecipient && handleDragStart(e, fieldType)}
            >
              <span className="text-lg mr-3">{fieldType.icon}</span>
              <div className="text-left">
                <div className="font-medium">{fieldType.label}</div>
                <div className="text-xs text-gray-500">
                  {fieldType.defaultWidth} × {fieldType.defaultHeight}px
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-sm text-blue-800 mb-2">How to add fields:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Click a field type, then click on the PDF</li>
            <li>• Or drag a field type onto the PDF</li>
            <li>• Drag fields to reposition them</li>
            <li>• Resize fields by dragging the corners</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
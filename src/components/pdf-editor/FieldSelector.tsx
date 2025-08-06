'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FieldType, FRIENDLY_FIELD_TYPE } from './types';
import { 
  PenTool, 
  Type, 
  Mail, 
  User, 
  CalendarDays, 
  Clock,
  Hash,
  Disc,
  CheckSquare,
  ChevronDown
} from 'lucide-react';

interface FieldSelectorProps {
  selectedField: FieldType | null;
  onSelectedFieldChange: (fieldType: FieldType | null) => void;
  onStartDrag?: (fieldType: FieldType, mouseEvent: MouseEvent) => void;
  disabled?: boolean;
}

const FIELD_TYPE_CONFIG = [
  { type: FieldType.SIGNATURE, label: 'Signature', icon: PenTool },
  { type: FieldType.INITIALS, label: 'Initials', icon: User },
  { type: FieldType.EMAIL, label: 'Email', icon: Mail },
  { type: FieldType.NAME, label: 'Name', icon: User },
  { type: FieldType.DATE, label: 'Date', icon: CalendarDays },
  { type: FieldType.SIGN_DATE, label: 'Sign Date', icon: Clock },
  { type: FieldType.TEXT, label: 'Text', icon: Type },
  { type: FieldType.NUMBER, label: 'Number', icon: Hash },
  // { type: FieldType.RADIO, label: 'Radio', icon: Disc },
  // { type: FieldType.CHECKBOX, label: 'Checkbox', icon: CheckSquare },
  // { type: FieldType.DROPDOWN, label: 'Dropdown', icon: ChevronDown },
];

export const FieldSelector: React.FC<FieldSelectorProps> = ({ 
  selectedField, 
  onSelectedFieldChange, 
  onStartDrag,
  disabled = false 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Field Types</CardTitle>
        <p className="text-sm text-gray-600">
          {selectedField ? 'Click on the PDF to place the field' : onStartDrag ? 'Click for click-to-place or drag to drop on PDF' : 'Select a field type to add'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_TYPE_CONFIG.map((field) => {
            const IconComponent = field.icon;
            const isSelected = selectedField === field.type;
            
            return (
              <button
                key={field.type}
                onPointerDown={(e) => {
                  if (onStartDrag) {
                    onStartDrag(field.type, e.nativeEvent as MouseEvent);
                  } else {
                    onSelectedFieldChange(isSelected ? null : field.type);
                  }
                }}
                disabled={disabled}
                data-selected={isSelected}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all',
                  'hover:bg-gray-50 active:scale-95',
                  disabled && 'opacity-50 cursor-not-allowed',
                  // Only show selected state when not using drag system
                  !onStartDrag && isSelected && 'border-blue-500 bg-blue-50 shadow-sm',
                  (!isSelected || onStartDrag) && 'border-gray-200'
                )}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-xs font-medium text-center leading-tight">
                  {field.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {selectedField && !onStartDrag && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              Selected: {FRIENDLY_FIELD_TYPE[selectedField]}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Click anywhere on the PDF to place this field
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectedFieldChange(null)}
              className="mt-2 h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm text-gray-800 mb-2">Instructions:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Click field button then click PDF to place</li>
            <li>• Or hold and drag field button to PDF</li>
            <li>• Drag existing fields to reposition</li>
            <li>• Resize fields by dragging the corners</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
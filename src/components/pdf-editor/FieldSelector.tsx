'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  DollarSign
} from 'lucide-react';

interface FieldSelectorProps {
  selectedField: FieldType | null;
  onSelectedFieldChange: (fieldType: FieldType | null) => void;
  onStartDrag?: (fieldType: FieldType, mouseEvent: MouseEvent, label?: string) => void;
  disabled?: boolean;
  accordionState?: boolean;
  onToggleAccordion?: () => void;
}

const PRIMARY_FIELD_TYPES = [
  { type: FieldType.SIGNATURE, label: 'Signature', icon: PenTool },
  { type: FieldType.INITIALS, label: 'Initials', icon: User },
  { type: FieldType.NAME, label: 'Name', icon: User },
];

const LEASE_SPECIFIC_FIELDS = [
  { type: FieldType.DATE, label: 'Move In Date', icon: CalendarDays, fieldLabel: 'Move In Date' },
  { type: FieldType.DATE, label: 'Move Out Date', icon: CalendarDays, fieldLabel: 'Move Out Date' },
  { type: FieldType.NUMBER, label: 'Rent Amount', icon: DollarSign, fieldLabel: 'Rent Amount' },
];

const OTHER_FIELD_TYPES = [
  { type: FieldType.EMAIL, label: 'Email', icon: Mail },
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
  disabled = false,
  accordionState = true,
  onToggleAccordion
}) => {
  const [showMore, setShowMore] = useState(false);
  return (
    <Card className="mb-6">
      <CardContent className="p-3">
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={onToggleAccordion}
        >
          <h3 className="font-medium">Field Types</h3>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              accordionState ? 'rotate-180' : ''
            }`}
          />
        </div>
        {accordionState && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              {selectedField ? 'Click on the PDF to place the field' : onStartDrag ? 'Click for click-to-place or drag to drop on PDF' : 'Select a field type to add'}
            </p>
            
            {/* All fields - Primary + Expanded */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Primary field types */}
              {PRIMARY_FIELD_TYPES.map((field) => {
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
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
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
              
              {/* Expanded fields (revealed when More is clicked) */}
              {showMore && (
                <>
                  {/* Lease-specific fields */}
                  {LEASE_SPECIFIC_FIELDS.map((field) => {
                    const IconComponent = field.icon;
                    const isSelected = selectedField === field.type;
                    
                    return (
                      <button
                        key={field.fieldLabel}
                        onPointerDown={(e) => {
                          if (onStartDrag) {
                            onStartDrag(field.type, e.nativeEvent as MouseEvent, field.fieldLabel);
                          } else {
                            onSelectedFieldChange(isSelected ? null : field.type);
                          }
                        }}
                        disabled={disabled}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
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
                  
                  {/* Regular Date field */}
                  <button
                    onPointerDown={(e) => {
                      if (onStartDrag) {
                        onStartDrag(FieldType.DATE, e.nativeEvent as MouseEvent);
                      } else {
                        const isSelected = selectedField === FieldType.DATE;
                        onSelectedFieldChange(isSelected ? null : FieldType.DATE);
                      }
                    }}
                    disabled={disabled}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
                      'hover:bg-gray-50 active:scale-95',
                      disabled && 'opacity-50 cursor-not-allowed',
                      // Only show selected state when not using drag system
                      !onStartDrag && selectedField === FieldType.DATE && 'border-blue-500 bg-blue-50 shadow-sm',
                      (selectedField !== FieldType.DATE || onStartDrag) && 'border-gray-200'
                    )}
                  >
                    <CalendarDays className="h-5 w-5" />
                    <span className="text-xs font-medium text-center leading-tight">
                      Date
                    </span>
                  </button>
                  
                  {/* Generic field types */}
                  {OTHER_FIELD_TYPES.map((field) => {
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
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
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
                </>
              )}
              
              {/* More/Less button - always last */}
              <button
                onClick={() => setShowMore(!showMore)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
                  'hover:bg-gray-50 active:scale-95',
                  showMore ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200'
                )}
              >
                {showMore ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                <span className="text-xs font-medium text-center leading-tight">
                  {showMore ? 'Less' : 'More'}
                </span>
              </button>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
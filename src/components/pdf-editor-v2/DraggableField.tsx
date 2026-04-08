'use client';

import React, { useState } from 'react';
import { Rnd } from 'react-rnd';

export interface FieldData {
  id: string;
  type: 'signature' | 'text' | 'date' | 'checkbox' | 'dropdown';
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  recipientId: string;
  required?: boolean;
  placeholder?: string;
}

interface DraggableFieldProps {
  field: FieldData;
  onUpdate: (id: string, updates: Partial<FieldData>) => void;
  onRemove: (id: string) => void;
  recipientColor: string;
  isActive?: boolean;
  onSelect?: (id: string) => void;
}

export const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  onUpdate,
  onRemove,
  recipientColor,
  isActive,
  onSelect,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const getFieldIcon = () => {
    switch (field.type) {
      case 'signature':
        return '✍️';
      case 'text':
        return 'T';
      case 'date':
        return '📅';
      case 'checkbox':
        return '☐';
      case 'dropdown':
        return '▼';
      default:
        return '?';
    }
  };

  const getFieldLabel = () => {
    switch (field.type) {
      case 'signature':
        return 'Signature';
      case 'text':
        return field.placeholder || 'Text';
      case 'date':
        return 'Date';
      case 'checkbox':
        return 'Checkbox';
      case 'dropdown':
        return 'Dropdown';
      default:
        return 'Field';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(field.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(field.id);
  };

  return (
    <Rnd
      position={{ x: field.x, y: field.y }}
      size={{ width: field.width, height: field.height }}
      onDragStart={() => {
        setIsDragging(true);
        onSelect?.(field.id);
      }}
      onDragStop={(e, d) => {
        setIsDragging(false);
        onUpdate(field.id, { x: d.x, y: d.y });
      }}
      onResizeStart={() => {
        setIsResizing(true);
        onSelect?.(field.id);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setIsResizing(false);
        onUpdate(field.id, {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          ...position,
        });
      }}
      minWidth={80}
      minHeight={30}
      bounds="parent"
      className={`field-item group ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        border: `2px solid ${recipientColor}`,
        backgroundColor: `${recipientColor}20`,
        zIndex: isDragging || isResizing ? 1000 : isActive ? 100 : 1,
      }}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      resizeHandleStyles={{
        top: { backgroundColor: recipientColor, height: '6px' },
        right: { backgroundColor: recipientColor, width: '6px' },
        bottom: { backgroundColor: recipientColor, height: '6px' },
        left: { backgroundColor: recipientColor, width: '6px' },
        topRight: { backgroundColor: recipientColor, width: '10px', height: '10px' },
        bottomRight: { backgroundColor: recipientColor, width: '10px', height: '10px' },
        bottomLeft: { backgroundColor: recipientColor, width: '10px', height: '10px' },
        topLeft: { backgroundColor: recipientColor, width: '10px', height: '10px' },
      }}
    >
      <div 
        className="field-content h-full w-full flex items-center justify-center relative cursor-move select-none"
        onClick={handleClick}
      >
        <span className="field-icon mr-2 text-sm">{getFieldIcon()}</span>
        <span className="field-label text-xs font-medium truncate flex-1">
          {getFieldLabel()}
        </span>
        {field.required && <span className="required text-red-500 text-xs ml-1">*</span>}
        <button 
          className="remove-btn absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemove}
          title="Remove field"
        >
          ×
        </button>
      </div>
    </Rnd>
  );
};
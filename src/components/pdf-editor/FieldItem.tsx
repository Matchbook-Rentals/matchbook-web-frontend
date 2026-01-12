'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import { cn } from '@/lib/utils';
import { FieldFormType, MIN_HEIGHT_PX, MIN_WIDTH_PX, FieldType } from './types';
import { useRecipientColors } from './recipient-colors';
import { FieldContent } from './FieldContent';
import { Calendar } from 'lucide-react';
import type { Recipient } from './RecipientManager';

interface FieldItemProps {
  field: FieldFormType;
  recipient?: Recipient;
  onResize?: (fieldId: string, newBounds: { x: number; y: number; width: number; height: number }) => void;
  onMove?: (fieldId: string, newBounds: { x: number; y: number; width: number; height: number }) => void;
  onRemove?: (fieldId: string) => void;
  onAddSignDate?: (fieldId: string) => void;
  onAddInitialDate?: (fieldId: string) => void;
  onFieldClick?: (field: FieldFormType) => void;
  active?: boolean;
  pageElement?: HTMLElement;
  signedValue?: any;
  showValues?: boolean;
  canRemove?: boolean;
  isMobile?: boolean; // Use touch events on mobile, click on desktop
}

export const FieldItem: React.FC<FieldItemProps> = ({
  field,
  recipient,
  onResize,
  onMove,
  onRemove,
  onAddSignDate,
  onAddInitialDate,
  onFieldClick,
  active = false,
  pageElement,
  signedValue,
  showValues = false,
  canRemove = true,
  isMobile = false
}) => {
  const [dimensions, setDimensions] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 40,
  });

  // Track touch start position to detect taps vs drags
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const TAP_THRESHOLD = 10; // pixels - if movement is less than this, it's a tap

  const recipientIndex = field.recipientIndex ?? 0;
  // For invalid recipient indices, use default styles
  const recipientColors = useRecipientColors(recipientIndex);
  const signerStyles = (recipientIndex < 0) ?
    { base: 'ring-gray-400', fieldItem: 'hover:ring-gray-500' } :
    recipientColors;

  // Helper function to get the border color for the recipient
  const getRecipientBorderColor = () => {
    const colorMap: Record<number, string> = {
      0: '#0B6E6E', // host
      1: '#fb8c00', // primaryRenter
      2: 'rgb(59, 130, 246)', // blue
      3: 'rgb(168, 85, 247)', // purple
      4: 'rgb(34, 197, 94)', // green
      5: 'rgb(239, 68, 68)', // red
      6: 'rgb(236, 72, 153)', // pink
      7: 'rgb(99, 102, 241)', // indigo
      8: 'rgb(234, 179, 8)', // yellow
      9: 'rgb(16, 185, 129)', // emerald
    };
    return colorMap[recipientIndex] || '#6B7280';
  };

  // Calculate pixel positions from percentages
  const calculateDimensions = useCallback(() => {
    if (!pageElement) return;

    const { width: pageWidth, height: pageHeight } = pageElement.getBoundingClientRect();
    
    // Convert percentages to pixels relative to page
    const x = (field.pageX / 100) * pageWidth;
    const y = (field.pageY / 100) * pageHeight;
    const width = (field.pageWidth / 100) * pageWidth;
    const height = (field.pageHeight / 100) * pageHeight;

    setDimensions({ x, y, width, height });
  }, [field, pageElement]);

  useEffect(() => {
    calculateDimensions();
    
    const handleResize = () => calculateDimensions();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateDimensions]);

  const handleDragStop = useCallback((_e: any, data: any) => {
    if (!pageElement || !onMove) return;
    
    const { width: pageWidth, height: pageHeight } = pageElement.getBoundingClientRect();
    
    // Convert pixels back to percentages
    const pageX = (data.x / pageWidth) * 100;
    const pageY = (data.y / pageHeight) * 100;
    
    onMove(field.formId, {
      x: data.x,
      y: data.y,
      width: dimensions.width,
      height: dimensions.height,
    });
  }, [field.formId, onMove, pageElement, dimensions]);

  const handleResizeStop = useCallback((_e: any, _direction: any, ref: any, _delta: any, position: any) => {
    if (!pageElement || !onResize) return;
    
    onResize(field.formId, {
      x: position.x,
      y: position.y,
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    });
  }, [field.formId, onResize, pageElement]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove?.(field.formId);
  };

  const handleAddSignDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAddSignDate?.(field.formId);
  };

  const handleAddInitialDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAddInitialDate?.(field.formId);
  };

  const handleFieldClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Call the field click handler if provided
    onFieldClick?.(field);
  };

  // Touch handlers to detect taps on mobile (Rnd intercepts events for drag handling)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - touchStart.x);
    const dy = Math.abs(touch.clientY - touchStart.y);

    // If minimal movement, treat as tap and select field
    if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
      onFieldClick?.(field);
    }

    setTouchStart(null);
  };

  if (!pageElement) return null;

  return (
    <Rnd
      data-field-id={field.formId}
      className={cn('group absolute', {
        'z-[100]': active,
        'z-[20]': !active,
      })}
      style={{ zIndex: active ? 100 : 20 }}
      size={{ width: dimensions.width, height: dimensions.height }}
      position={{ x: dimensions.x, y: dimensions.y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minHeight={MIN_HEIGHT_PX}
      minWidth={MIN_WIDTH_PX}
      bounds="parent"
      enableResizing={isMobile ? false : {
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
    >
      <div
        className={cn(
          'relative flex h-full w-full items-center justify-center rounded-[2px]',
          'bg-white/90 px-2 transition-colors cursor-move',
          active ? 'ring-[3px] ring-black' : 'ring-2',
          !active && signerStyles.base,
          !active && signerStyles.fieldItem,
        )}
        {...(isMobile
          ? { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd }
          : { onClick: handleFieldClick }
        )}
      >
        <FieldContent
          field={field}
          recipient={recipient}
          signedValue={signedValue}
          showValues={showValues}
        />

        {/* Field label in top-left corner - show when field has default value */}
        {field.fieldMeta?.defaultValue && field.fieldMeta?.label && (
          <div
            className={cn(
              "absolute -top-2 -left-2 px-1.5 py-0.5 text-[10px] font-semibold text-white rounded shadow-sm transition-opacity duration-200",
              isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            style={{
              backgroundColor: getRecipientBorderColor(),
              zIndex: 201,
            }}
          >
            {field.fieldMeta.label}
          </div>
        )}

        {/* Add sign date button - desktop only (mobile uses MobileFieldActionBar) */}
        {!isMobile && field.type === FieldType.SIGNATURE && onAddSignDate && (
          <button
            className="absolute -top-2 -left-2 h-5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[200] px-2 gap-1"
            onClick={handleAddSignDate}
            title="Add sign date field"
          >
            <span>+</span>
            <span className="whitespace-nowrap">Sign Date</span>
          </button>
        )}

        {/* Add initial date button - desktop only (mobile uses MobileFieldActionBar) */}
        {!isMobile && field.type === FieldType.INITIALS && onAddInitialDate && (
          <button
            className="absolute -top-2 -left-2 h-5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[200] px-2 gap-1"
            onClick={handleAddInitialDate}
            title="Add initial date field"
          >
            <span>+</span>
            <span className="whitespace-nowrap">Date</span>
          </button>
        )}

        {/* Remove button - desktop only (mobile uses MobileFieldActionBar) */}
        {!isMobile && canRemove && (
          <button
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[200]"
            onClick={handleRemove}
            title="Remove field"
          >
            ×
          </button>
        )}
      </div>
    </Rnd>
  );
};
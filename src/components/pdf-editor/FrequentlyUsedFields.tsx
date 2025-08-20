'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { FieldType } from './types';

interface FrequentlyUsedFieldsProps {
  accordionState: boolean;
  onToggleAccordion: () => void;
  startFieldDetection: (
    fieldType: FieldType,
    recipientId: string,
    mouseEvent: MouseEvent,
    label?: string
  ) => void;
}

export const FrequentlyUsedFields: React.FC<FrequentlyUsedFieldsProps> = ({
  accordionState,
  onToggleAccordion,
  startFieldDetection,
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-3">
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={onToggleAccordion}
        >
          <h3 className="font-medium">Frequently Used Fields</h3>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              accordionState ? 'rotate-180' : ''
            }`}
          />
        </div>
        {accordionState && (
          <div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onMouseDown={(e) => {
                  startFieldDetection(FieldType.SIGNATURE, 'host-recipient', e.nativeEvent as MouseEvent);
                }}
              >
                + Host Signature
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onMouseDown={(e) => {
                  startFieldDetection(FieldType.NAME, 'host-recipient', e.nativeEvent as MouseEvent, 'Host Name');
                }}
              >
                + Host Name
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onMouseDown={(e) => {
                  startFieldDetection(FieldType.SIGNATURE, 'primary-renter-recipient', e.nativeEvent as MouseEvent);
                }}
              >
                + Renter Signature
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onMouseDown={(e) => {
                  startFieldDetection(FieldType.NAME, 'primary-renter-recipient', e.nativeEvent as MouseEvent, 'Renter Name');
                }}
              >
                + Renter Name
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onMouseDown={(e) => {
                  startFieldDetection(FieldType.NUMBER, 'host-recipient', e.nativeEvent as MouseEvent, 'Monthly Rent');
                }}
              >
                + Monthly Rent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onMouseDown={(e) => {
                  startFieldDetection(FieldType.DATE, 'host-recipient', e.nativeEvent as MouseEvent, 'Start Date');
                }}
              >
                + Start Date
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onMouseDown={(e) => {
                  startFieldDetection(FieldType.DATE, 'host-recipient', e.nativeEvent as MouseEvent, 'End Date');
                }}
              >
                + End Date
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Hold mouse down to start drag, release over PDF to place field
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
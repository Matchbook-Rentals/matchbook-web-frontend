'use client'
import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { Booking, ListingUnavailability } from '@prisma/client';
import { BrandButton } from '../brandButton';
import { EditUnavailabilityDialog } from './edit-unavailability-dialog';

interface ScheduleViewerPopoverDayProps {
  day: number;
  booking?: Booking;
  unavailability?: ListingUnavailability;
  onDeleteUnavailability?: (unavailabilityId: string) => void;
  onEditUnavailability?: (unavailability: ListingUnavailability) => void;
}

const ScheduleViewerPopoverDay: React.FC<ScheduleViewerPopoverDayProps> = ({ day, booking, unavailability, onDeleteUnavailability, onEditUnavailability }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const getStatusClass = (booking: Booking | undefined, unavailability: ListingUnavailability | undefined) => {
    if (unavailability) {
      return 'bg-gray-300 hover:bg-gray-500';
    }
    if (booking) {
      switch (booking.status) {
        case 'active':
          return 'bg-primaryBrand/80 hover:bg-primaryBrand/100';
        case 'finished':
          return 'bg-pinkBrand/80 hover:bg-pinkBrand/100';
        case 'reserved':
          return 'bg-blueBrand/80 hover:bg-blueBrand/100';
        default:
          return '';
      }
    }
    return '';
  };

  const bgColor = getStatusClass(booking, unavailability);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={`h-12 flex items-center justify-center border transition ${bgColor} cursor-pointer`}>
          {day}
        </div>
      </PopoverTrigger>
      <PopoverContent>
        {booking && (
          <div className="space-y-2">
            <div>
              <p><strong>ID:</strong> {booking.id}</p>
              <p><strong>Name:</strong> {booking.userId}</p>
              <p><strong>Start Date:</strong> {booking.startDate.toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {booking.endDate.toLocaleDateString()}</p>
            </div>
            <div className="flex justify-end pt-2">
              <BrandButton variant="outline" size="sm">
                View Booking
              </BrandButton>
            </div>
          </div>
        )}
        {unavailability && (
          <div className="space-y-2">
            <div>
              <p><strong>Start Date:</strong> {unavailability.startDate.toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {unavailability.endDate.toLocaleDateString()}</p>
              {unavailability.reason && <p><strong>Reason:</strong> {unavailability.reason}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <BrandButton 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditDialogOpen(true)}
              >
                Edit
              </BrandButton>
              <BrandButton 
                variant="outline" 
                size="sm" 
                onClick={() => onDeleteUnavailability?.(unavailability.id)}
              >
                Delete
              </BrandButton>
            </div>
          </div>
        )}
        {unavailability && (
          <EditUnavailabilityDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            unavailability={unavailability}
            onSave={(updatedUnavailability) => {
              onEditUnavailability?.(updatedUnavailability);
              setIsEditDialogOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ScheduleViewerPopoverDay;
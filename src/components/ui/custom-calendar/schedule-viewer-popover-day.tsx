'use client'
import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { Booking, ListingUnavailability } from '@prisma/client';
import { BrandButton } from '../brandButton';
import { EditUnavailabilityDialog } from './edit-unavailability-dialog';
import { Dialog, DialogContent } from '../../brandDialog';

interface ScheduleViewerPopoverDayProps {
  day: number;
  booking?: Booking;
  unavailability?: ListingUnavailability;
  onDeleteUnavailability?: (unavailabilityId: string) => void;
  onEditUnavailability?: (unavailability: ListingUnavailability) => void;
}

const ScheduleViewerPopoverDay: React.FC<ScheduleViewerPopoverDayProps> = ({ day, booking, unavailability, onDeleteUnavailability, onEditUnavailability }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
        <div className={`h-12 flex test items-center justify-center border transition ${bgColor} cursor-pointer`}>
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
              <BrandButton variant="default" size="sm">
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
                variant="destructive-outline" 
                size="sm" 
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete
              </BrandButton>
              <BrandButton 
                variant="default" 
                size="sm" 
                onClick={() => setIsEditDialogOpen(true)}
              >
                Edit
              </BrandButton>
            </div>
          </div>
        )}
        {unavailability && (
          <>
            <EditUnavailabilityDialog
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              unavailability={unavailability}
              onSave={(updatedUnavailability) => {
                onEditUnavailability?.(updatedUnavailability);
                setIsEditDialogOpen(false);
              }}
            />
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[400px] flex flex-col">
                <div className="flex items-center justify-center">
                  <h2 className="text-lg font-semibold text-gray-900 text-center">Delete this unavailable period?</h2>
                </div>
                
                <div className="flex-1 py-4">
                  <p className="text-gray-600">
                    This will permanently remove the unavailable period from {unavailability.startDate.toLocaleDateString()} to {unavailability.endDate.toLocaleDateString()}. This action cannot be undone.
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <BrandButton
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </BrandButton>
                  <BrandButton
                    variant="destructive"
                    onClick={() => {
                      onDeleteUnavailability?.(unavailability.id);
                      setIsDeleteDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    Delete
                  </BrandButton>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ScheduleViewerPopoverDay;

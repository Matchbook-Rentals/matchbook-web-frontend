"use client";

import React from 'react';

/**
 * DATABASE SCHEMA - PROPERTY DETAILS SECTION FIELDS
 * 
 * From Listing model in Prisma schema:
 * - roomCount: Int (number of bedrooms)
 * - bathroomCount: Int (number of bathrooms)
 * - squareFootage: Int @default(0) (square feet)
 * - guestCount: Int? (maximum guests - optional)
 * 
 * Related models:
 * - bedrooms: Bedroom[] (relation to Bedroom model with bedroomNumber, bedType)
 */
interface ListingPropertyDetailsSchema {
  roomCount: number;
  bathroomCount: number;
  squareFootage: number;
  guestCount: number | null;
}

interface BedroomSchema {
  id: string;
  listingId: string;
  bedroomNumber: number;
  bedType: string;
}
import { ListingAndImages } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Loader2, PencilIcon, Bed, Bath, Square, Plus, Minus } from 'lucide-react';

interface ListingSummaryPropertyDetailsProps {
  listing: ListingAndImages;
  formData: any;
  isEditing: boolean;
  buttonState: 'saving' | 'success' | 'failed' | null;
  isSaving: boolean;
  hasChanges: boolean;
  isValid: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdateField: (field: string, value: any) => void;
}

const ListingSummaryPropertyDetails: React.FC<ListingSummaryPropertyDetailsProps> = ({
  listing,
  formData,
  isEditing,
  buttonState,
  isSaving,
  hasChanges,
  isValid,
  onToggleEdit,
  onSave,
  onCancel,
  onUpdateField,
}) => {
  const sectionHeaderStyles = "text-2xl font-semibold text-gray-900";

  // Format room details
  const formatRoomDetails = () => {
    const beds = listing.roomCount || 0;
    const baths = listing.bathroomCount || 0;
    const sqft = listing.squareFootage || 'N/A';
    return { beds, baths, sqft };
  };

  // Render edit buttons
  const renderEditButtons = () => {
    const canSave = hasChanges && isValid;
    
    if (isEditing) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={buttonState === 'success' ? "default" : buttonState === 'failed' ? "destructive" : "default"}
            className={`
              h-8 px-3 transition-all duration-300 ease-out
              ${buttonState ? 'w-full z-10' : ''}
              ${buttonState === 'success' ? 'bg-secondaryBrand hover:bg-secondaryBrand text-white' : 
                buttonState === 'failed' ? 'bg-red-600 hover:bg-red-600' : 
                !canSave && !buttonState ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50' : 
                canSave && !buttonState ? 'bg-secondaryBrand hover:bg-secondaryBrand/90 text-white' : ''}
            `}
            onClick={() => !buttonState && canSave && onSave()}
            disabled={isSaving || (buttonState === 'saving' || buttonState === 'failed') || (!buttonState && !canSave)}
          >
            {buttonState === 'saving' ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : buttonState === 'success' ? (
              <span>Success!</span>
            ) : buttonState === 'failed' ? (
              <span>Failed!</span>
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className={`
              h-8 px-3 transition-all duration-300 ease-out
              ${buttonState ? 'w-0 opacity-0 overflow-hidden p-0' : ''}
              ${!canSave ? 'opacity-100' : ''}
            `}
            onClick={onCancel}
            disabled={isSaving || !!buttonState}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3"
        onClick={onToggleEdit}
      >
        <PencilIcon className="w-6 h-6" />
      </Button>
    );
  };

  const roomDetails = formatRoomDetails();

  return (
    <Card className="shadow-[0px_0px_5px_#00000029] p-0 lg:min-h-[140px]">
      <CardContent className="flex flex-col items-end gap-[18px] p-6">
        <div className="flex items-center justify-end gap-8 relative flex-1 self-stretch w-full">
          <div className="flex-1 opacity-90 text-2xl font-semibold text-gray-900 relative mt-[-1.00px]">
            Property Details
          </div>
          {renderEditButtons()}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="text-center">
              <label className="text-sm font-medium text-gray-700">Bedrooms</label>
              <div className="flex items-center gap-3 px-3 py-2 mt-1 w-fit mx-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => onUpdateField('roomCount', Math.max(0, (formData.roomCount || 0) - 1))}
                  disabled={(formData.roomCount || 0) <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium min-w-[2rem] text-center">{formData.roomCount || 0}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => onUpdateField('roomCount', (formData.roomCount || 0) + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-center">
              <label className="text-sm font-medium text-gray-700">Bathrooms</label>
              <div className="flex items-center gap-3 px-3 py-2 mt-1 w-fit mx-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => onUpdateField('bathroomCount', Math.max(0, (formData.bathroomCount || 0) - 0.5))}
                  disabled={(formData.bathroomCount || 0) <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium min-w-[2rem] text-center">{formData.bathroomCount || 0}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => onUpdateField('bathroomCount', (formData.bathroomCount || 0) + 0.5)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-center">
              <label className="text-sm font-medium text-gray-700">Square Feet</label>
              <Input
                type="number"
                min="0"
                value={formData.squareFootage || ''}
                onChange={(e) => onUpdateField('squareFootage', parseInt(e.target.value) || null)}
                className="mt-1"
                placeholder="Square footage"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-[41px] relative self-stretch w-full flex-[0_0_auto]">
            {/* Bedroom */}
            <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 relative flex-[0_0_auto] rounded-full">
              <Bed className="w-5 h-5 text-gray-500" />
              <div className="relative w-fit mt-[-1.00px] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                {roomDetails.beds} Bedroom{roomDetails.beds !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Bathroom */}
            <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 relative flex-[0_0_auto] rounded-full">
              <Bath className="w-5 h-5 text-gray-500" />
              <div className="relative w-fit mt-[-1.00px] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                {roomDetails.baths} Bathroom{roomDetails.baths !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Square Footage */}
            <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 relative flex-[0_0_auto] rounded-full">
              <Square className="w-5 h-5 text-gray-500" />
              <div className="relative w-fit mt-[-1.00px] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                {roomDetails.sqft} Sqft
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingSummaryPropertyDetails;

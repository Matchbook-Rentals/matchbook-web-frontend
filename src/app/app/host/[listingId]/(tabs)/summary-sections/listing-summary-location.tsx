"use client";

import React from 'react';

/**
 * DATABASE SCHEMA - LOCATION SECTION FIELDS
 * 
 * From Listing model in Prisma schema:
 * - streetAddress1: String? (primary street address)
 * - streetAddress2: String? (apartment/unit/suite)
 * - city: String? (city name)
 * - state: String? (state/province)
 * - postalCode: String? (ZIP/postal code)
 * - latitude: Float @default(0) (GPS latitude)
 * - longitude: Float @default(0) (GPS longitude)
 * - locationString: String? (formatted location string)
 * - approvalStatus: ApprovalStatus @default(pendingReview) (approval status - changes to pendingReview when location updated)
 */
interface ListingLocationSchema {
  streetAddress1: string | null;
  streetAddress2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  locationString: string | null;
  approvalStatus: 'approved' | 'rejected' | 'pendingReview';
}
import { ListingAndImages } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Loader2, PencilIcon, MapPin } from 'lucide-react';

interface ListingSummaryLocationProps {
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
  onEditClick: () => void; // This will trigger the brand dialog
}

const ListingSummaryLocation: React.FC<ListingSummaryLocationProps> = ({
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
  onEditClick,
}) => {
  const sectionHeaderStyles = "text-2xl font-semibold text-gray-900";
  const noLabelStyles = "text-md font-normal text-gray-500";

  // Format address
  const formatAddress = () => {
    const parts = [
      listing.streetAddress1,
      listing.streetAddress2,
      listing.city,
      listing.state,
      listing.postalCode
    ].filter(Boolean);
    return parts.join(', ');
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
        onClick={onEditClick}
      >
        <PencilIcon className="w-6 h-6" />
      </Button>
    );
  };

  return (
    <Card className="shadow-[0px_0px_5px_#00000029] p-0 lg:min-h-[140px]">
      <CardContent className="flex flex-col items-end gap-[18px] p-6">
        <div className="flex items-center justify-end gap-8 relative flex-1 self-stretch w-full">
          <div className="relative flex-1 opacity-90 text-2xl font-semibold text-gray-900">
            Location
          </div>
          {renderEditButtons()}
        </div>

        {isEditing ? (
          <div className="space-y-4 w-full">
            <div>
              <label className="text-sm font-medium text-gray-700">Street Address</label>
              <Input
                value={formData.streetAddress1 || ''}
                onChange={(e) => onUpdateField('streetAddress1', e.target.value)}
                className="mt-1"
                placeholder="Enter street address"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Apartment/Unit (Optional)</label>
              <Input
                value={formData.streetAddress2 || ''}
                onChange={(e) => onUpdateField('streetAddress2', e.target.value)}
                className="mt-1"
                placeholder="Apt, suite, etc."
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">City</label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => onUpdateField('city', e.target.value)}
                  className="mt-1"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">State</label>
                <Input
                  value={formData.state || ''}
                  onChange={(e) => onUpdateField('state', e.target.value)}
                  className="mt-1"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">ZIP Code</label>
                <Input
                  value={formData.postalCode || ''}
                  onChange={(e) => onUpdateField('postalCode', e.target.value)}
                  className="mt-1"
                  placeholder="ZIP"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div className={noLabelStyles}>
                {formatAddress()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingSummaryLocation;
"use client";

import React from 'react';

/**
 * DATABASE SCHEMA - HIGHLIGHTS SECTION FIELDS
 * 
 * From Listing model in Prisma schema:
 * - title: String (property title)
 * - category: String? (property type: singleFamily, apartment, townhouse, privateRoom)
 * - furnished: Boolean @default(false) (furnished status)
 * - petsAllowed: Boolean @default(false) (pets allowed)
 */
interface ListingHighlightsSchema {
  title: string;
  category: string | null;
  furnished: boolean;
  petsAllowed: boolean;
}
import { ListingAndImages } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Check, X, Loader2, PencilIcon } from 'lucide-react';
import { PropertyType } from '@/constants/enums';

interface ListingSummaryHighlightsProps {
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

const ListingSummaryHighlights: React.FC<ListingSummaryHighlightsProps> = ({
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
  const labelStyles = "text-md font-normal text-gray-500";
  const valueStyles = "text-md font-medium text-gray-900";

  // Format property type display
  const formatPropertyType = (type: string | undefined) => {
    if (!type) return 'Unknown';
    
    const propertyTypeLabels: { [key: string]: string } = {
      'singleFamily': 'Single Family',
      'apartment': 'Apartment',
      'townhouse': 'Townhouse',
      'privateRoom': 'Private Room'
    };
    
    return propertyTypeLabels[type] || type;
  };

  // Format furnished status
  const formatFurnished = (furnished: boolean | undefined) => {
    return furnished ? 'Furnished' : 'Unfurnished';
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

  return (
    <Card className="p-6 flex flex-col gap-8 rounded-xl shadow-[0px_0px_5px_#00000029]">
      <div className="flex items-center justify-between w-full">
        <h2 className={sectionHeaderStyles}>Highlights</h2>
        {renderEditButtons()}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Property Title</label>
            <Input
              value={formData.title || ''}
              onChange={(e) => onUpdateField('title', e.target.value)}
              className="mt-1"
              placeholder="Enter property title"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Property Type</label>
            <Select value={formData.category || ''} onValueChange={(value) => onUpdateField('category', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PropertyType.SingleFamily}>Single Family</SelectItem>
                <SelectItem value={PropertyType.Apartment}>Apartment</SelectItem>
                <SelectItem value={PropertyType.Townhouse}>Townhouse</SelectItem>
                <SelectItem value={PropertyType.PrivateRoom}>Private Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Furnished Status</label>
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                checked={formData.furnished || false}
                onCheckedChange={(checked) => onUpdateField('furnished', checked)}
              />
              <span className="text-sm">{formData.furnished ? 'Furnished' : 'Unfurnished'}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Pets Allowed</label>
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                checked={formData.petsAllowed || false}
                onCheckedChange={(checked) => onUpdateField('petsAllowed', checked)}
              />
              <span className="text-sm">{formData.petsAllowed ? 'Pets allowed' : 'No pets'}</span>
            </div>
          </div>
        </div>
      ) : (
        <CardContent className="flex items-start gap-6 p-0">
          <div className="flex flex-col items-start gap-1.5 w-[374px]">
            <div className={labelStyles}>Property Title</div>
            <div className={valueStyles}>{listing.title || 'No title'}</div>
          </div>
          <div className="flex flex-col items-start gap-1.5 w-[212px]">
            <div className={labelStyles}>Property Type</div>
            <div className={valueStyles}>{formatPropertyType(listing.category)}</div>
          </div>
          <div className="flex flex-col items-start gap-1.5 w-[235px]">
            <div className={labelStyles}>Furnished Status</div>
            <div className={valueStyles}>{formatFurnished(listing.furnished)}</div>
          </div>
          <div className="flex flex-col items-start gap-1.5 flex-1">
            <div className={labelStyles}>Pets Allowed</div>
            <div className={valueStyles}>{listing.petsAllowed ? 'Pets allowed' : 'No Pets'}</div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ListingSummaryHighlights;
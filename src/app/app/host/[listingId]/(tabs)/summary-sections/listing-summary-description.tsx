"use client";

import React from 'react';

/**
 * DATABASE SCHEMA - DESCRIPTION SECTION FIELDS
 * 
 * From Listing model in Prisma schema:
 * - description: String @db.VarChar(1500) (property description, max 1500 chars)
 */
interface ListingDescriptionSchema {
  description: string;
}
import { ListingAndImages } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Loader2, PencilIcon } from 'lucide-react';

interface ListingSummaryDescriptionProps {
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

const ListingSummaryDescription: React.FC<ListingSummaryDescriptionProps> = ({
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
  const noLabelStyles = "text-md font-normal text-gray-500";

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
    <Card className="w-full shadow-[0px_0px_5px_#00000029] rounded-xl">
      <CardContent className="p-6 flex flex-col gap-[18px]">
        <div className="flex items-center justify-between w-full">
          <h2 className={sectionHeaderStyles}>Description</h2>
          {renderEditButtons()}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-[18px] w-full">
            <label className="text-sm font-medium text-gray-700">Property Description</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => onUpdateField('description', e.target.value)}
              className="mt-1"
              placeholder="Describe your property..."
              rows={6}
            />
            <div className="mt-1 text-sm">
              {(() => {
                const charCount = (formData.description || '').length;
                if (charCount < 20) {
                  return (
                    <span className="text-red-600">
                      {20 - charCount} characters more required
                    </span>
                  );
                } else if (charCount >= 20 && charCount <= 1000) {
                  return (
                    <span className="text-green-600">
                      {charCount}/1000 characters used
                    </span>
                  );
                } else {
                  return (
                    <span className="text-red-600">
                      {charCount}/1000 characters used
                    </span>
                  );
                }
              })()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[18px] w-full">
            <p className={`${noLabelStyles} whitespace-pre-wrap`}>
              {listing.description || 'No description provided.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingSummaryDescription;
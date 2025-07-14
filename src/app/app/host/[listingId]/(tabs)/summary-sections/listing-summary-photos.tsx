"use client";

import React from 'react';

/**
 * DATABASE SCHEMA - PHOTOS SECTION FIELDS
 * 
 * From ListingImage model in Prisma schema:
 * - id: String @id @default(uuid())
 * - url: String (image URL)
 * - listingId: String (foreign key to Listing)
 * - category: String? (optional category/type of image)
 * - rank: Int? (display order, lower = earlier in sequence)
 * 
 * Relationship:
 * - listing: Listing? @relation(fields: [listingId], references: [id], onDelete: Cascade)
 * - @@index([listingId]) (indexed for performance)
 * 
 * Business Rules:
 * - Minimum 4 photos required for listing approval
 * - Maximum 30 photos allowed per listing
 * - Images ordered by rank (ASC), then by creation order if rank is null
 * - First 4 images are considered "cover photos" for search display
 */
interface ListingImageSchema {
  id: string;
  url: string;
  listingId: string;
  category: string | null;
  rank: number | null;
}

import { ListingAndImages } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, PencilIcon, Upload, Trash2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { BrandButton } from "@/components/ui/brandButton";

interface UploadProgress {
  totalFiles: number;
  uploadedFiles: number;
  currentBatch: number;
  totalBatches: number;
  isUploading: boolean;
  errors: string[];
}

interface ListingSummaryPhotosProps {
  listing: ListingAndImages;
  formData: any;
  uploadProgress: UploadProgress;
  isEditing: boolean;
  buttonState: 'saving' | 'success' | 'failed' | null;
  isSaving: boolean;
  hasChanges: boolean;
  isValid: boolean;
  draggedImageId: string | null;
  dragOverTrash: boolean;
  dropPreviewIndex: number | null;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDragStart: (e: React.DragEvent, imageId: string) => void;
  onDragOver: (e: React.DragEvent, index?: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragEnterTrash: (e: React.DragEvent) => void;
  onDragLeaveTrash: (e: React.DragEvent) => void;
  onDropOnTrash: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
}

const ListingSummaryPhotos: React.FC<ListingSummaryPhotosProps> = ({
  listing,
  formData,
  uploadProgress,
  isEditing,
  buttonState,
  isSaving,
  hasChanges,
  isValid,
  draggedImageId,
  dragOverTrash,
  dropPreviewIndex,
  onToggleEdit,
  onSave,
  onCancel,
  onFileSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnterTrash,
  onDragLeaveTrash,
  onDropOnTrash,
  onDrop,
}) => {
  const sectionHeaderStyles = "text-2xl font-semibold text-gray-900";

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

  if (!listing.listingImages || listing.listingImages.length === 0) {
    return null;
  }

  return (
    <Card className="w-full rounded-xl shadow-[0px_0px_5px_#00000029]">
      <CardHeader className="p-6 pb-0">
        <div className="flex items-center justify-between w-full">
          <CardTitle className={sectionHeaderStyles}>
            Photos ({listing.listingImages.length})
          </CardTitle>
          {renderEditButtons()}
        </div>
      </CardHeader>

      <CardContent className="px-6 py-8 flex justify-start">
        {isEditing ? (
          <div className="w-full space-y-6">
            {/* Upload Section */}
            <div className="flex flex-col items-center gap-4">
              {/* Upload progress display */}
              {uploadProgress.isUploading && (
                <div className="w-full max-w-md space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading photos...</span>
                    <span>{uploadProgress.uploadedFiles} of {uploadProgress.totalFiles} photos</span>
                  </div>
                  <Progress 
                    value={uploadProgress.totalFiles > 0 
                      ? Math.round((uploadProgress.uploadedFiles / uploadProgress.totalFiles) * 100)
                      : 0
                    } 
                    className="h-2" 
                  />
                  <p className="text-xs text-center text-gray-500">
                    Please wait while your photos are being uploaded...
                  </p>
                </div>
              )}

              {/* Upload button */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                  onChange={onFileSelect}
                  disabled={uploadProgress.isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <BrandButton
                  variant="outline"
                  disabled={uploadProgress.isUploading}
                  className="min-w-[160px] max-w-[280px]"
                >
                  {uploadProgress.isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Click to upload
                    </>
                  )}
                </BrandButton>
              </div>
              
              <p className="text-sm text-gray-500 text-center max-w-md">
                SVG, PNG, WEBP, or JPG (max of 30 images, large files will be automatically resized)
              </p>
              
              {/* Photo count validation - only show if below 4 photos */}
              {(() => {
                const photoCount = (formData.listingImages || []).filter((photo: any) => photo.url).length;
                if (photoCount < 4) {
                  return (
                    <div className="text-sm text-center">
                      <span className="text-red-600">
                        {4 - photoCount} more photo{4 - photoCount !== 1 ? 's' : ''} required (minimum 4)
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Drag and Drop Photos */}
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">Drag photos to reorder or drop on trash to delete</p>
              
              {/* Trash Zone */}
              <div
                className={`w-full h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
                  dragOverTrash ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
                onDragOver={onDragOver}
                onDragEnter={onDragEnterTrash}
                onDragLeave={onDragLeaveTrash}
                onDrop={onDropOnTrash}
              >
                <div className="flex items-center gap-2 text-gray-500">
                  <Trash2 className="w-5 h-5" />
                  <span>Drop here to delete</span>
                </div>
              </div>

              {/* Photo Grid */}
              <div 
                className="flex flex-wrap gap-4 justify-start"
                onDragLeave={onDragLeave}
              >
                {(formData.listingImages || []).map((image: any, index: number) => (
                  <div key={image.id} className="relative">
                    {/* Drop Preview Indicator */}
                    {dropPreviewIndex === index && draggedImageId !== image.id && (
                      <div className="absolute -left-2 top-0 w-1 h-full bg-blue-500 rounded-full z-10" />
                    )}
                    
                    <div
                      className={`w-[175px] h-[108px] relative rounded-lg overflow-hidden cursor-grab border-2 transition-all border-transparent ${
                        draggedImageId === image.id 
                          ? 'opacity-50 border-black scale-95' 
                          : dropPreviewIndex === index && draggedImageId !== image.id
                          ? 'border-blue-300 shadow-lg'
                          : 'hover:border-gray-300'
                      }`}
                      draggable
                      onDragStart={(e) => onDragStart(e, image.id)}
                      onDragOver={(e) => onDragOver(e, index)}
                      onDrop={(e) => onDrop(e, index)}
                    >
                      <img
                        src={image.url}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-white text-black text-xs px-2 py-1 rounded font-medium border border-black">
                        {index < 4 ? 'Cover Photo' : index + 1}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Invisible placeholder that becomes drop zone when dragging */}
                <div
                  className={`w-[175px] h-[108px] border-2 rounded-lg flex items-center justify-center transition-colors ${
                    draggedImageId
                      ? dropPreviewIndex === (formData.listingImages?.length || 0)
                        ? 'border-dashed border-blue-500 bg-blue-50'
                        : 'border-dashed border-gray-300'
                      : 'border-transparent'
                  }`}
                  onDragOver={(e) => onDragOver(e, formData.listingImages?.length || 0)}
                  onDrop={(e) => onDrop(e, formData.listingImages?.length || 0)}
                >
                  {draggedImageId && (
                    <span className="text-gray-500 text-sm">Drop here</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-start">
            {listing.listingImages.map((image, index) => (
              <div key={index} className="w-[175px] h-[108px] relative rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingSummaryPhotos;
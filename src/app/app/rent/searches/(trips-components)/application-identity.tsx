import React, { useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadButton } from '@/app/utils/uploadthing';
import { Card, CardContent } from '@/components/ui/card';
import { SecureFileList } from '@/components/secure-file-viewer';
import { Upload, Loader2, Camera } from 'lucide-react';
import { ImageCategory } from '@prisma/client';
import { useApplicationStore } from '@/stores/application-store';
import { useToast } from "@/components/ui/use-toast";
import BrandModal from '@/components/BrandModal';
import { deleteIDPhoto } from '@/app/actions/applications';

interface UploadData {
  name: string;
  size: number;
  key: string;
  serverData: {
    uploadedBy: string;
    fileUrl: string;
    fileKey?: string;
    fileName?: string;
    uploadType?: string;
    isPrivate?: boolean;
  };
  url: string;
  customId: string | null;
  type: string;
}

interface VerificationImage {
  url: string;
  category: ImageCategory
}

interface IDPhoto {
  id?: string;
  url?: string;
  fileKey?: string;
  customId?: string;
  fileName?: string;
  isPrimary: boolean;
}

interface IdentificationItem {
  id: string;
  idType: string;
  idNumber: string;
  isPrimary: boolean;
  idPhotos?: IDPhoto[];
}

interface IdentificationProps {
  error?: {
    idType?: string;
    idNumber?: string;
    isPrimary?: string;
    idPhotos?: string;
    primaryPhoto?: string;
  };
}

const ID_TYPES = [
  { value: "driversLicense", label: "Driver\'s License" },
  { value: "passport", label: "Passport" }
];

interface IdentificationProps {
  inputClassName?: string;
  isMobile?: boolean;
}

export const Identification: React.FC<IdentificationProps> = ({ inputClassName, isMobile = false }) => {
  const { toast } = useToast();
  const { 
    ids, 
    setIds, 
    verificationImages, 
    setVerificationImages, 
    errors,
    fieldErrors,
    saveField,
    validateField,
    setFieldError,
    clearFieldError
  } = useApplicationStore();
  const error = errors.identification;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // State for deletion modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{ index: number; photo: any } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get current ID (or first ID) - always make it primary
  const currentId = ids[0] || { id: '', idType: '', idNumber: '', isPrimary: true, idPhotos: [] };

  // If not already primary, make it primary
  if (!currentId.isPrimary) {
    currentId.isPrimary = true;
  }


  const handleUploadFinish = async (res: UploadData[]) => {
    console.log('Upload complete, received data:', res);
    // Check if we have existing photos
    const hasExistingPhotos = currentId.idPhotos && currentId.idPhotos.length > 0;

    // Convert uploaded images to IDPhotos - store file keys instead of direct URLs
    const newPhotos = res.map((upload, index) => {
      const photo = {
        fileKey: upload.key || upload.serverData?.fileKey,
        customId: upload.customId,
        fileName: upload.name || upload.serverData?.fileName,
        // Only set as primary if there are no existing photos and this is the first uploaded photo
        isPrimary: !hasExistingPhotos && index === 0,
        // Don't store direct URL for security
        url: undefined
      };
      console.log('Created photo object:', photo);
      return photo;
    });

    // Add photos to current ID without creating a new ID
    const updatedId = {
      ...currentId,
      isPrimary: true, // Ensure ID is marked as primary
      idPhotos: [...(currentId.idPhotos || []), ...newPhotos]
    };

    // Only update the current ID, keeping all other IDs unchanged
    setIds([updatedId, ...ids.slice(1)]);

    // Also keep old functionality for backward compatibility
    const newImages = res.map((upload) => ({
      id: upload.customId || '',
      url: upload.url,
      category: 'Identification' as ImageCategory,
      applicationId: ''
    }));
    setVerificationImages([...verificationImages, ...newImages]);
    
    // IMMEDIATELY save the ID photos to the backend with completion checking
    const fieldPath = 'identifications.0.idPhotos';
    if (isDevelopment) {
      console.log(`[Identification] Saving ID photos immediately for ${fieldPath}`);
    }
    
    const result = await saveField(fieldPath, updatedId.idPhotos, { checkCompletion: true });
    
    // Handle completion status changes
    if (result.success && result.completionStatus) {
      if (result.completionStatus.statusChanged) {
        if (result.completionStatus.isComplete) {
          toast({
            title: "Application Complete! 🎉",
            description: "All required information has been provided",
            duration: 4000,
          });
        } else if (result.completionStatus.missingRequirements?.length > 0) {
          const missing = result.completionStatus.missingRequirements.slice(0, 3).join(', ');
          const more = result.completionStatus.missingRequirements.length > 3 
            ? ` and ${result.completionStatus.missingRequirements.length - 3} more` 
            : '';
          toast({
            title: "Application Incomplete",
            description: `Still need: ${missing}${more}`,
            duration: 4000,
          });
        }
      }
    }
    
    if (result.success) {
      toast({
        title: "ID Photo Uploaded",
        description: `Successfully uploaded ${res.length} photo${res.length !== 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      console.error(`[Identification] Failed to save ID photos:`, result.error);
      toast({
        title: "Save Failed",
        description: "Photos uploaded but failed to save. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };


  // Handle photo deletion confirmation
  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;
    
    setIsDeleting(true);
    const { index, photo } = photoToDelete;
    
    try {
      // Remove from local state immediately
      const updatedPhotos = idPhotos.filter((_, i) => i !== index);
      const updatedId = {
        ...currentId,
        idPhotos: updatedPhotos
      };
      setIds([updatedId, ...ids.slice(1)]);
      
      // If photo exists in database, delete it
      if (photo.id) {
        const result = await deleteIDPhoto(photo.id);
        
        if (result.success) {
          toast({
            title: "Photo Deleted",
            description: "ID photo has been removed successfully",
            duration: 3000,
          });
          
          // Save the updated photos list and check completion status
          const fieldPath = 'identifications.0.idPhotos';
          const saveResult = await saveField(fieldPath, updatedPhotos, { checkCompletion: true });
          
          // Handle completion status changes
          if (saveResult.success && saveResult.completionStatus) {
            if (saveResult.completionStatus.statusChanged && !saveResult.completionStatus.isComplete) {
              toast({
                title: "Application Incomplete",
                description: "Your application is now incomplete. Please add an ID photo.",
                variant: "destructive",
                duration: 5000,
              });
            }
          }
        } else {
          // Restore the photo in local state if deletion failed
          const restoredId = {
            ...currentId,
            idPhotos: currentId.idPhotos
          };
          setIds([restoredId, ...ids.slice(1)]);
          
          toast({
            title: "Deletion Failed",
            description: result.error || "Failed to delete photo",
            variant: "destructive",
            duration: 4000,
          });
        }
      } else {
        // New photo not in DB yet, just removed from local state
        toast({
          title: "Photo Removed",
          description: "Photo has been removed",
          duration: 2000,
        });
        
        // Save the updated photos list and check completion status
        const fieldPath = 'identifications.0.idPhotos';
        const saveResult = await saveField(fieldPath, updatedPhotos, { checkCompletion: true });
        
        // Handle completion status changes
        if (saveResult.success && saveResult.completionStatus) {
          if (saveResult.completionStatus.statusChanged && !saveResult.completionStatus.isComplete) {
            toast({
              title: "Application Incomplete",
              description: "Your application is now incomplete. Please add an ID photo.",
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setPhotoToDelete(null);
    }
  };

  // Find ID photos either from new schema or old schema for backward compatibility
  const idPhotos = currentId.idPhotos?.length ?
    currentId.idPhotos :
    verificationImages
      .filter(img => img.category === 'Identification')
      .map((img, idx) => ({
        url: img.url,
        isPrimary: idx === 0 // Make first one primary by default
      }));

  return (
    <Card className={`${isMobile ? '' : 'h-[534px]'} w-full p-6 bg-neutral-50 rounded-xl border-0`}>
      <CardContent className="p-0 flex flex-col gap-8 h-full">
        <div className="flex flex-col items-start gap-5 w-full">
          <h2 className="[font-family:'Poppins',Helvetica] font-medium text-gray-3800 text-xl tracking-[-0.40px] leading-normal">
            Identification
          </h2>

          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} w-full`}>
            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="flex flex-col items-start gap-1.5 w-full">
                  <div className="inline-flex items-center gap-1.5">
                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      ID Type
                    </Label>
                    <span className="text-red-500 ml-1">*</span>
                  </div>

                  <Select
                    value={currentId.idType}
                    onValueChange={(value) => {
                      const fieldPath = 'identifications.0.idType';
                      
                      // Update local state immediately
                      const updatedId = { ...currentId, idType: value };
                      setIds([updatedId, ...ids.slice(1)]);
                      
                      // Validate only (no auto-save)
                      const validationError = validateField(fieldPath, value);
                      if (validationError) {
                        setFieldError(fieldPath, validationError);
                        if (isDevelopment) {
                          console.log(`[Identification] Validation error for ${fieldPath}:`, validationError);
                        }
                      } else {
                        clearFieldError(fieldPath);
                        if (isDevelopment) {
                          console.log(`[Identification] Field ${fieldPath} validated successfully (no auto-save)`);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className={`h-12 px-3 py-2 bg-white rounded-lg border shadow-shadows-shadow-xs ${error?.idType ? 'border-red-500' : 'border-[#d0d5dd]'}`}>
                      <SelectValue
                        placeholder="Select ID Type"
                        className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {error?.idType && <p className="mt-1 text-red-500 text-sm">{error.idType}</p>}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="inline-flex items-center gap-1.5">
                  <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                    ID Number
                  </Label>
                  <span className="text-red-500 ml-1">*</span>
                </div>

                <Input
                  value={currentId.idNumber}
                  onChange={(e) => {
                    const { value } = e.target;
                    const fieldPath = 'identifications.0.idNumber';
                    
                    // Update local state immediately
                    const updatedId = { ...currentId, idNumber: value };
                    setIds([updatedId, ...ids.slice(1)]);
                    
                    // Validate only (no auto-save)
                    const validationError = validateField(fieldPath, value);
                    if (validationError) {
                      setFieldError(fieldPath, validationError);
                      if (isDevelopment) {
                        console.log(`[Identification] Validation error for ${fieldPath}:`, validationError);
                      }
                    } else {
                      clearFieldError(fieldPath);
                      if (isDevelopment) {
                        console.log(`[Identification] Field ${fieldPath} validated successfully (no auto-save)`);
                      }
                    }
                  }}
                  placeholder="Enter ID Number"
                  className={`${inputClassName || `${isMobile ? 'py-3' : 'h-12'} px-3 ${isMobile ? '' : 'py-2'} bg-white rounded-lg border shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`} ${error?.idNumber ? 'border-red-500' : ''}`}
                />
                {error?.idNumber && <p className="mt-1 text-red-500 text-sm">{error.idNumber}</p>}
              </div>
            </div>
          </div>

          <div className={`${isMobile ? '' : 'h-[337px]'} flex ${isMobile ? 'flex-col gap-3' : 'items-center gap-5'} w-full`}>
            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="flex flex-col items-start gap-1.5 w-full">
                  <div className="inline-flex flex-col items-start justify-center gap-1.5">
                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Please upload A photo&nbsp;&nbsp;of your ID
                    </Label>
                    <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-neutralneutral-600 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                      Upload ID (Front)
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-[18px] w-full">
                    <div className="flex flex-col items-start gap-3 w-full">
                      <UploadButton<UploadData, unknown>
                        endpoint="incomeUploader"
                        config={{
                          mode: "auto",
                          ...(isMobile && {
                            input: {
                              accept: "image/*",
                              capture: "environment"
                            }
                          })
                        }}
                        className="uploadthing-custom w-full"
                        appearance={{
                          button: `flex ${isMobile ? 'flex-row gap-3 px-4 py-4' : 'flex-col h-[140px] gap-[35px] px-[100px] py-[21px]'} box-border items-center justify-center w-full bg-white rounded-xl border border-dashed border-[#036e49] cursor-pointer hover:bg-gray-50 transition-colors text-inherit`,
                          allowedContent: "hidden",
                        }}
                        onUploadBegin={(name) => {
                          console.log('🚀 ID upload begin for file:', name);
                        }}
                        onUploadProgress={(progress) => {
                          console.log('📊 ID upload progress:', progress, '%');
                        }}
                        onUploadAborted={() => {
                          console.warn('⚠️ ID upload was aborted');
                          toast({
                            title: "Upload Cancelled",
                            description: "ID upload was cancelled or timed out",
                            variant: "destructive"
                          });
                        }}
                        content={{
                          button: ({ ready, isUploading }) => (
                            <div className={`inline-flex ${isMobile ? 'flex-row' : 'flex-col'} items-center justify-center gap-3`}>
                              {isUploading ? (
                                <Loader2 className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-secondaryBrand animate-spin`} />
                              ) : (
                                isMobile ? (
                                  <Camera className="w-6 h-6 text-secondaryBrand" />
                                ) : (
                                  <Upload className="w-8 h-8 text-secondaryBrand" />
                                )
                              )}

                              <div className="flex items-center gap-2">
                                <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#717680] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                                  {isUploading ? "Uploading..." : (isMobile ? "Upload or take photo" : "Drag and drop file or")}
                                </div>
                                {!isUploading && !isMobile && (
                                  <span className="font-text-label-small-medium font-[number:var(--text-label-small-medium-font-weight)] text-[#0b6969] text-[length:var(--text-label-small-medium-font-size)] tracking-[var(--text-label-small-medium-letter-spacing)] leading-[var(--text-label-small-medium-line-height)] [font-style:var(--text-label-small-medium-font-style)] underline">
                                    Browse
                                  </span>
                                )}
                              </div>
                            </div>
                          ),
                        }}
                        onBeforeUploadBegin={(files) => {
                          console.log('📤 ID onBeforeUploadBegin called with', files.length, 'files');
                          
                          // Validate files
                          const maxFiles = 5;
                          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                          const maxSize = 50 * 1024 * 1024; // 50MB
                          
                          const errors: string[] = [];
                          
                          if (files.length > maxFiles) {
                            errors.push(`You can only upload up to ${maxFiles} files at once.`);
                          }
                          
                          files.forEach((file) => {
                            if (!allowedTypes.includes(file.type.toLowerCase())) {
                              const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'unknown';
                              errors.push(`File "${file.name}" has unsupported type "${fileExtension}". Please use PNG or JPG files only.`);
                            }
                            
                            if (file.size > maxSize) {
                              errors.push(`File "${file.name}" is too large. Maximum size is 50MB.`);
                            }
                          });
                          
                          if (errors.length > 0) {
                            errors.forEach((error, index) => {
                              setTimeout(() => {
                                toast({
                                  title: "Upload Error",
                                  description: error,
                                  variant: "destructive"
                                });
                              }, index * 100);
                            });
                            return [];
                          }
                          
                          return files;
                        }}
                        onClientUploadComplete={async (res) => {
                          console.log('✅ ID upload complete:', res);
                          handleUploadFinish(res);
                          
                          toast({
                            title: "Upload Successful",
                            description: `Successfully uploaded ${res.length} ID photo${res.length !== 1 ? 's' : ''}.`,
                            variant: "default"
                          });
                        }}
                        onUploadError={(error) => {
                          console.error("💥 ID upload error:", error);
                          toast({
                            title: "Upload Error",
                            description: error.message || "Failed to upload ID photos. Please try again.",
                            variant: "destructive"
                          });
                        }}
                      />

                      <div className="flex items-center gap-1 w-full">
                        <div className="flex-1 font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-gray-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                          Supported formats: PNG, JPG
                        </div>
                        <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-gray-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                          Maximum size: 50MB
                        </div>
                      </div>
                      {error?.idPhotos && <p className="mt-1 text-red-500 text-sm">{error.idPhotos}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex flex-col items-start gap-1.5 pt-4 pb-0 px-0 w-full">
                <div className="flex flex-col items-start gap-[18px] w-full">
                  <div className="flex flex-col items-start gap-3 w-full">
                    {idPhotos && idPhotos.length > 0 ? (
                      <SecureFileList
                        files={idPhotos.map(photo => ({
                          fileKey: photo.fileKey,
                          customId: photo.customId,
                          fileName: photo.fileName || 'ID Photo',
                          isPrimary: photo.isPrimary,
                          // Support backward compatibility with direct URLs
                          url: photo.url
                        }))}
                        fileType="image"
                        className="w-full"
                        onRemove={(index) => {
                          // Show confirmation modal
                          setPhotoToDelete({ index, photo: idPhotos[index] });
                          setDeleteModalOpen(true);
                        }}
                      />
                    ) : (
                      <div className={`flex flex-col ${isMobile ? 'gap-3 px-4 py-4' : 'h-[140px] gap-[35px] px-[100px] py-[21px]'} box-border items-center justify-center w-full bg-white rounded-xl border border-solid border-[#e7f0f0]`}>
                        <div className="inline-flex flex-col items-center justify-center gap-3">
                          <svg
                            className="w-11 h-11 text-gray-600"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/>
                            <path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/>
                            <circle cx="13" cy="7" r="1" fill="currentColor"/>
                            <rect x="8" y="2" width="14" height="14" rx="2"/>
                          </svg>

                          <div className="flex flex-col items-start justify-center w-full">
                            <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-gray-600 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                              ID Photos will display here
                            </div>
                            <div className="w-full font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-gray-400 text-[length:var(--text-label-xsmall-regular-font-size)] text-center tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                              At least 1 photo is required
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Delete Confirmation Modal */}
      <BrandModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        heightStyle="!top-[30vh]"
        className="max-w-md"
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-3">Delete Photo</h2>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this photo? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setPhotoToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePhoto}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Photo'
              )}
            </Button>
          </div>
        </div>
      </BrandModal>
    </Card>
  );
};

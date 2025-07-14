import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UploadButton } from "@/app/utils/uploadthing";
import { BrandButton } from "@/components/ui/brandButton";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

import type { NullableListingImage } from "./add-property-client";

interface ListingPhotosProps {
  listingPhotos: NullableListingImage[];
  setListingPhotos: React.Dispatch<React.SetStateAction<NullableListingImage[]>>;
}

export const ListingPhotos = ({ listingPhotos, setListingPhotos }: ListingPhotosProps): JSX.Element => {
  const { toast } = useToast();
  
  // Track if validation failed to prevent success toast
  const [validationFailed, setValidationFailed] = React.useState(false);

  // Client-side file validation (removed size check since we auto-resize)
  const validateFiles = (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const maxFiles = 30;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    
    // Check total file count including existing photos
    const currentPhotoCount = listingPhotos.filter(photo => photo.url).length;
    const totalCount = currentPhotoCount + files.length;
    
    // Priority check: Total count limit (includes existing photos)
    if (totalCount > maxFiles) {
      errors.push(`You can only have up to ${maxFiles} photos total. You currently have ${currentPhotoCount} photos and are trying to add ${files.length} more.`);
      // Early return - don't check other things if we're over the total limit
      return { valid: false, errors };
    }
    
    // Secondary check: Single batch size (only if total count is OK)
    if (files.length > maxFiles) {
      errors.push(`You can only upload up to ${maxFiles} files at once. You selected ${files.length} files.`);
      return { valid: false, errors };
    }
    
    // Check each file
    files.forEach((file, index) => {
      // File type check
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'unknown';
        errors.push(`File "${file.name}" has unsupported type "${fileExtension}". Please use JPG, JPEG, PNG, SVG, or WEBP files only.`);
      }
      
      // Filename length check
      if (file.name.length > 255) {
        errors.push(`File "${file.name}" has a name that's too long. Please use a shorter filename.`);
      }
      
      // Note: File size validation removed - large images will be automatically resized on the server
    });
    
    
    return { valid: errors.length === 0, errors };
  };

  const deletePhoto = async (photoId: string | null, photoUrl: string) => {
    if (!photoId) return;
    
    // Remove from local state immediately
    setListingPhotos(prev => prev.filter(photo => photo.id !== photoId));
    
    // Send delete request to backend (fire and forget)
    try {
      await fetch('/api/delete-photo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId, photoUrl }),
      });
    } catch (error) {
      console.error('Failed to delete photo from backend:', error);
    }
  };
  
  // Data for the upload component
  const uploadData = {
    title: "Show us what your place looks like",
    subtitle: "Listings with high quality photos get the most bookings",
    mainText: "Click or drag and drop photos below",
    actionText: "Upload from your device",
  };

  // Focus styles for keyboard navigation only
  const focusStyles = `
    .uploadthing-focus {
      /* Target the specific label with data-ut-element="button" */
      & label[data-ut-element="button"] {
        /* Disable the default focus-within ring */
        &:focus-within {
          --tw-ring-color: transparent !important;
          --tw-ring-offset-width: 0px !important;
          --tw-ring-width: 0px !important;
        }
        
        /* Only show focus ring when child has focus-visible (keyboard nav) */
        &:has(input:focus-visible) {
          outline: 2px solid black !important;
          outline-offset: 4px !important;
          transition: none !important;
        }
      }
    }
  `;

  return (
    <div className="w-full">
      <style dangerouslySetInnerHTML={{ __html: focusStyles }} />
      <div className="flex flex-col gap-2">
        <Card className="mt-0 border-none">
          <CardContent className="p-0">
            <div className="flex min-h-[300px] md:min-h-[400px] lg:min-h-[534px] items-center gap-2 px-4 md:px-8 py-6 md:py-8 lg:py-[34px] bg-[#f4f4f4] rounded-xl border-2 border-solid border-[#d9dadf] flex-col justify-center w-full">
              <div className="flex gap-8 md:gap-16 lg:gap-[100px] flex-col items-center relative flex-[0_0_auto] max-w-full">
                <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                  <div className="relative w-full max-w-[260px] h-[100px] md:h-[120px] lg:h-[142px]">
                    <img
                      src="/listing-upload/upload-photo.png"
                      alt="Upload photos"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="relative self-stretch font-text-xs-regular text-[#475467] text-center">
                    SVG, PNG, WEBP, or JPG (max of 30 images, large files will be automatically resized)
                  </p>
                </div>
                <UploadButton
                  endpoint="listingUploadPhotos"
                  config={{
                    mode: "auto"
                  }}
                  className="uploadthing-focus uploadthing-custom"
                  appearance={{
                    button: "border border-primaryBrand bg-background text-primaryBrand hover:bg-primaryBrand hover:text-white transition-all duration-300 h-[40px] md:h-[44px] min-w-[160px] max-w-[280px] rounded-lg px-[14px] py-[10px] gap-1 font-['Poppins'] font-semibold text-sm md:text-base leading-5 tracking-normal w-full disabled:opacity-50 disabled:cursor-not-allowed",
                    allowedContent: "hidden",
                  }}
                  onUploadBegin={(name) => {
                    console.log('🚀 Upload begin for file:', name);
                  }}
                  onUploadProgress={(progress) => {
                    console.log('📊 Upload progress:', progress, '%');
                  }}
                  onUploadAborted={() => {
                    console.warn('⚠️ Upload was aborted');
                    toast({
                      title: "Upload Cancelled",
                      description: "Upload was cancelled or timed out",
                      variant: "destructive"
                    });
                  }}
                  content={{
                    button: ({ ready, isUploading }) => {
                      console.log('🔄 Button state:', { ready, isUploading });
                      return (
                        <div className="flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-gray-500 focus-visible:outline-offset-2">
                          {isUploading && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          <span>{isUploading ? "Uploading..." : "Click to upload"}</span>
                        </div>
                      );
                    },
                  }}
                  onBeforeUploadBegin={(files) => {
                    console.log('📤 onBeforeUploadBegin called with', files.length, 'files');
                    files.forEach((file, index) => {
                      console.log(`📄 File ${index + 1}: ${file.name}, ${(file.size / (1024 * 1024)).toFixed(2)}MB, ${file.type}`);
                    });
                    
                    // Client-side validation before upload begins
                    const validation = validateFiles(files);
                    
                    if (!validation.valid) {
                      console.log('❌ Validation failed:', validation.errors);
                      setValidationFailed(true);
                      
                      // Show each error as a separate toast for better visibility
                      validation.errors.forEach((error, index) => {
                        setTimeout(() => {
                          toast({
                            title: "Upload Error",
                            description: error,
                            variant: "destructive"
                          });
                        }, index * 100); // Slight delay between toasts so they stack
                      });
                      
                      // Return empty array to prevent upload
                      return [];
                    }
                    
                    console.log('✅ Validation passed, proceeding with upload');
                    setValidationFailed(false);
                    return files;
                  }}
                  onClientUploadComplete={(res) => {
                    console.log('✅ onClientUploadComplete called with:', res);
                    
                    // Don't show success message if validation failed
                    if (validationFailed) {
                      console.log('⚠️ Validation had failed, skipping success message');
                      setValidationFailed(false);
                      return;
                    }
                    
                    // Each item in res is a file upload result
                    // Adapt this if your response shape is different
                    if (Array.isArray(res) && res.length > 0) {
                      const newPhotos: NullableListingImage[] = res.map((file, idx) => ({
                        id: file.key || null,
                        url: file.url || null,
                        listingId: null, // can be set later
                        category: null,
                        rank: null, // append to end
                      }));
                      setListingPhotos(prev => Array.isArray(prev) ? [...prev, ...newPhotos] : newPhotos);
                      
                      // Check if any files were resized or had errors
                      const resizedFiles = res.filter(file => file.wasResized);
                      const filesWithErrors = res.filter(file => file.resizeError);
                      
                      // Show success message with resize info if applicable
                      let description = `Successfully uploaded ${res.length} photo${res.length !== 1 ? 's' : ''}.`;
                      if (resizedFiles.length > 0) {
                        description += ` ${resizedFiles.length} file${resizedFiles.length !== 1 ? 's were' : ' was'} automatically resized to reduce file size.`;
                      }
                      
                      toast({
                        title: "Upload Successful",
                        description,
                        variant: "default"
                      });
                      
                      // Show resize errors as separate warnings if any occurred
                      filesWithErrors.forEach((file, index) => {
                        setTimeout(() => {
                          toast({
                            title: "Image Processing Warning",
                            description: file.resizeError || "Unknown processing error occurred",
                            variant: "destructive"
                          });
                        }, (index + 1) * 150); // Stagger error toasts
                      });
                    }
                  }}
                  onUploadError={(error) => {
                    console.error("💥 onUploadError called:", error);
                    console.error("Error details:", {
                      message: error.message,
                      cause: error.cause,
                      stack: error.stack,
                      name: error.name
                    });
                    
                    toast({
                      title: "Upload Error",
                      description: error.message || "Failed to upload photos. Please try again.",
                      variant: "destructive"
                    });
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Thumbnails of uploaded photos */}
        {(() => {
          const validPhotos = listingPhotos.filter(photo => photo.url);
          const validPhotoCount = validPhotos.length;
          
          return validPhotoCount > 0 && (
            <>
              <div className="mt-4 flex flex-row gap-2 flex-wrap">
                {validPhotos.map((photo, idx) => (
                  <div key={photo.id || idx} className="relative w-20 h-20 rounded overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center group">
                    <img
                      src={photo.url!}
                      alt={`Listing photo ${idx + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      onClick={() => deletePhoto(photo.id, photo.url!)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-black/30 hover:bg-black/80 text-white hover:text-red-500 rounded-full flex items-center justify-center z-10 shadow-md transition-colors duration-200"
                      aria-label="Delete photo"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-3 w-3" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default ListingPhotos;

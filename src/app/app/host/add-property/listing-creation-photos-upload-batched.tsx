import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brandButton";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { useUploadThing } from "@/app/utils/uploadthing";
import { Progress } from "@/components/ui/progress";

import type { NullableListingImage } from "./add-property-client";

interface ListingPhotosProps {
  listingPhotos: NullableListingImage[];
  setListingPhotos: React.Dispatch<React.SetStateAction<NullableListingImage[]>>;
}

interface UploadProgress {
  totalFiles: number;
  uploadedFiles: number;
  currentBatch: number;
  totalBatches: number;
  isUploading: boolean;
  errors: string[];
}

const BATCH_SIZE = 5; // Upload 5 files at a time
const MAX_PHOTOS = 30;

export const ListingPhotos = ({ listingPhotos, setListingPhotos }: ListingPhotosProps): JSX.Element => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    totalFiles: 0,
    uploadedFiles: 0,
    currentBatch: 0,
    totalBatches: 0,
    isUploading: false,
    errors: []
  });
  
  const { startUpload } = useUploadThing("listingUploadPhotos", {
    onClientUploadComplete: (res) => {
      // This is called after each batch completes
      if (Array.isArray(res) && res.length > 0) {
        const newPhotos: NullableListingImage[] = res.map((file) => ({
          id: file.key || null,
          url: file.url || null,
          listingId: null,
          category: null,
          rank: null,
        }));
        setListingPhotos(prev => [...prev, ...newPhotos]);
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles + res.length
        }));
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setUploadProgress(prev => ({
        ...prev,
        errors: [...prev.errors, error.message || "Upload failed"]
      }));
    }
  });

  // Client-side file validation
  const validateFiles = (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    
    // Check total file count including existing photos
    const currentPhotoCount = listingPhotos.filter(photo => photo.url).length;
    const totalCount = currentPhotoCount + files.length;
    
    if (totalCount > MAX_PHOTOS) {
      errors.push(`You can only have up to ${MAX_PHOTOS} photos total. You currently have ${currentPhotoCount} photos and are trying to add ${files.length} more.`);
      return { valid: false, errors };
    }
    
    // Check each file
    files.forEach((file) => {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'unknown';
        errors.push(`File "${file.name}" has unsupported type "${fileExtension}". Please use JPG, JPEG, PNG, SVG, or WEBP files only.`);
      }
      
      if (file.name.length > 255) {
        errors.push(`File "${file.name}" has a name that's too long. Please use a shorter filename.`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  // Smart distribution: larger files go to later batches for better UX
  const createBatches = (files: File[], batchSize: number): File[][] => {
    if (files.length === 0) return [];
    
    // Calculate number of batches needed
    const numBatches = Math.ceil(files.length / batchSize);
    const batches: File[][] = Array.from({ length: numBatches }, () => []);
    
    // Sort files by size (largest first) for smart distribution
    const sortedFiles = [...files].sort((a, b) => b.size - a.size);
    
    // Distribute files round-robin starting from the last batch (back-loading)
    // This puts largest files in later batches for better user psychology
    sortedFiles.forEach((file, index) => {
      const batchIndex = (numBatches - 1) - (index % numBatches);
      batches[batchIndex].push(file);
    });
    
    return batches;
  };

  // Handle file selection and batch upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    // Validate files
    const validation = validateFiles(files);
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        toast({
          title: "Upload Error",
          description: error,
          variant: "destructive"
        });
      });
      return;
    }
    
    // Create batches
    const batches = createBatches(files, BATCH_SIZE);
    
    // Initialize progress
    setUploadProgress({
      totalFiles: files.length,
      uploadedFiles: 0,
      currentBatch: 0,
      totalBatches: batches.length,
      isUploading: true,
      errors: []
    });
    
    // Upload batches sequentially
    let successCount = 0;
    let resizedCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      setUploadProgress(prev => ({
        ...prev,
        currentBatch: i + 1
      }));
      
      try {
        const result = await startUpload(batches[i]);
        if (result && result.length > 0) {
          successCount += result.length;
          resizedCount += result.filter(f => f.wasResized).length;
        }
      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error);
        setUploadProgress(prev => ({
          ...prev,
          errors: [...prev.errors, `Some photos failed to upload. Please try again.`]
        }));
      }
    }
    
    // Upload complete
    setUploadProgress(prev => ({
      ...prev,
      isUploading: false
    }));
    
    // Show completion message
    if (successCount > 0) {
      let description = `Successfully uploaded ${successCount} photo${successCount !== 1 ? 's' : ''}.`;
      if (resizedCount > 0) {
        description += ` ${resizedCount} photo${resizedCount !== 1 ? 's were' : ' was'} automatically resized to optimize size.`;
      }
      toast({
        title: "Photos Uploaded!",
        description,
        variant: "default"
      });
    }
    
    // Show any errors
    if (uploadProgress.errors.length > 0) {
      uploadProgress.errors.forEach((error) => {
        toast({
          title: "Upload Warning",
          description: error,
          variant: "destructive"
        });
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Calculate progress percentage
  const progressPercentage = uploadProgress.totalFiles > 0 
    ? Math.round((uploadProgress.uploadedFiles / uploadProgress.totalFiles) * 100)
    : 0;

  return (
    <div className="w-full">
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
                
                {/* Upload progress display */}
                {uploadProgress.isUploading && (
                  <div className="w-full max-w-md space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploading photos...</span>
                      <span>{uploadProgress.uploadedFiles} of {uploadProgress.totalFiles} photos</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-center text-gray-500">
                      Please wait while your photos are being uploaded...
                    </p>
                  </div>
                )}
                
                {/* Upload button */}
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                    onChange={handleFileSelect}
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
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Thumbnails of uploaded photos */}
        {(() => {
          const validPhotos = listingPhotos.filter(photo => photo.url);
          const validPhotoCount = validPhotos.length;
          
          return validPhotoCount > 0 && (
            <div className="mt-4 flex flex-row gap-2 flex-wrap min-h-[264px] pb-6">
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
                    disabled={uploadProgress.isUploading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ListingPhotos;
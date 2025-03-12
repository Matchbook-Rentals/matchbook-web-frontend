import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadButton } from '@uploadthing/react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ImageCategory } from '@prisma/client';
import { ApplicationItemLabelStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';

interface UploadData {
  name: string;
  size: number;
  key: string;
  serverData: {
    uploadedBy: string;
    fileUrl: string;
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
  url: string;
  isPrimary: boolean;
}

interface IdentificationItem {
  id: string;
  idType: string;
  idNumber: string;
  isPrimary: boolean;
  photos?: IDPhoto[];
}

interface IdentificationProps {
  error?: { 
    idType?: string; 
    idNumber?: string;
    isPrimary?: string;
    photos?: string;
    primaryPhoto?: string;
  };
}

const ID_TYPES = [
  { value: "driversLicense", label: "Driver\'s License" },
  { value: "passport", label: "Passport" }
];

export const Identification: React.FC = () => {
  const { ids, setIds, verificationImages, setVerificationImages, errors } = useApplicationStore();
  const error = errors.basicInfo.identification;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  // Get current ID (or first ID) - always make it primary
  const currentId = ids[0] || { id: '', idType: '', idNumber: '', isPrimary: true, photos: [] };
  
  // If not already primary, make it primary
  if (!currentId.isPrimary) {
    currentId.isPrimary = true;
  }

  const handleUploadFinish = (res: UploadData[]) => {
    // Check if we have existing photos
    const hasExistingPhotos = currentId.photos && currentId.photos.length > 0;
    
    // Convert uploaded images to IDPhotos
    const newPhotos = res.map((upload, index) => ({
      url: upload.url,
      // Only set as primary if there are no existing photos and this is the first uploaded photo
      isPrimary: !hasExistingPhotos && index === 0,
    }));
    
    // Add photos to current ID without creating a new ID
    const updatedId = {
      ...currentId,
      isPrimary: true, // Ensure ID is marked as primary
      photos: [...(currentId.photos || []), ...newPhotos]
    };
    
    // Only update the current ID, keeping all other IDs unchanged
    setIds([updatedId, ...ids.slice(1)]);
    
    // Also keep old functionality for backward compatibility
    const newImages = res.map((upload) => ({ url: upload.url, category: 'Identification' as ImageCategory }));
    setVerificationImages([...verificationImages, ...newImages]);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Find ID photos either from new schema or old schema for backward compatibility
  const idPhotos = currentId.photos?.length ? 
    currentId.photos : 
    verificationImages
      .filter(img => img.category === 'Identification')
      .map((img, idx) => ({ 
        url: img.url, 
        isPrimary: idx === 0 // Make first one primary by default
      }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label onClick={() => console.log(ids)} htmlFor="idType" className={ApplicationItemLabelStyles}>ID Type</Label>
          <Select
            value={currentId.idType}
            onValueChange={(value) => setIds([
              { ...currentId, idType: value },
              ...ids.slice(1)
            ])}
          >
            <SelectTrigger className={`${error?.idType ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select Identification Type" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map((type) => (
                <SelectItem key={type.value} className='cursor-pointer' value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error?.idType && <p className="mt-1 text-red-500 text-sm">{error.idType}</p>}
        </div>
        <div className="space-y-2 mb-4 lg:mb-8">
          <Label htmlFor="idNumber" className={ApplicationItemLabelStyles}>ID Number</Label>
          <Input
            id="idNumber"
            value={currentId.idNumber}
            placeholder='Identification Number'
            onChange={(e) => setIds([
              { ...currentId, idNumber: e.target.value },
              ...ids.slice(1)
            ])}
            className={error?.idNumber ? "border-red-500" : ""}
          />
          {error?.idNumber && <p className="mt-1 text-red-500 text-sm">{error.idNumber}</p>}
        </div>
      </div>
      
      
      <Label className={ApplicationItemLabelStyles}>Please upload photos of your ID</Label>
      {error?.photos && <p className="mt-1 text-red-500 text-sm">{error.photos}</p>}
      {error?.primaryPhoto && <p className="mt-1 text-red-500 text-sm">{error.primaryPhoto}</p>}
      
      <div className="grid grid-cols-2 gap-4">
        <div className='border border-gray-200 min-h-32 rounded-md flex justify-center items-center'>
          <UploadButton<UploadData>
            endpoint="idUploader"
            onClientUploadComplete={handleUploadFinish}
            onUploadError={(error: Error) => alert(error.message)}
            className="mb-0"
            appearance={{ button: 'bg-parent text-[#404040] border-[#404040] border-2  sm:4/5 px-2 focus-within:ring-[#404040] data-[state="uploading"]:after:bg-[#404040]' }}
          />
        </div>
        
        {idPhotos.length > 0 ? (
          <div className='border border-gray-300 rounded-md p-2'>
            <div className="flex flex-col gap-2 items-center">
              {idPhotos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <Dialog onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                    <DialogTrigger asChild>
                      <img
                        src={photo.url}
                        alt={`ID image ${idx + 1}`}
                        className={`w-full h-auto max-h-[300px] cursor-pointer `}
                        onClick={() => handleImageClick(idx)}
                      />
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>ID Image</DialogTitle>
                        <DialogDescription>Your identification document</DialogDescription>
                      </DialogHeader>
                      <Card>
                        <CardContent className="flex aspect-square  items-center justify-center p-4">
                          <img src={photo.url} alt={`ID image ${idx + 1}`} className="w-full h-auto" />
                        </CardContent>
                      </Card>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="absolute top-0 right-0 p-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    
                    {/* Delete button */}
                    <button
                      type="button"
                      className="bg-red-500 text-white p-1 rounded-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        // Remove this photo from the current ID
                        const updatedPhotos = currentId.photos?.filter((_, i) => i !== idx) || [];
                        
                        // If we're removing the primary photo, set a new primary if any photos left
                        if (photo.isPrimary && updatedPhotos.length > 0) {
                          updatedPhotos[0].isPrimary = true;
                        }
                        
                        // Update the ID with the new photos array
                        const updatedId = {
                          ...currentId,
                          photos: updatedPhotos
                        };
                        
                        setIds([updatedId, ...ids.slice(1)]);
                      }}
                      title="Delete photo"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {photo.isPrimary && (
                    <div className="absolute bottom-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`border ${error?.photos ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-md flex flex-col justify-center items-center p-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`${error?.photos ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {error?.photos ? 'Required: Please upload ID photos' : 'ID photos will display here'}
            </span>
            <span className="text-xs text-gray-400 mt-1">
              At least one photo is required
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

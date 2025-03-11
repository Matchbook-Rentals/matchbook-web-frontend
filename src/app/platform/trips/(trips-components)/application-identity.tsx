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
    // Convert uploaded images to IDPhotos - make first uploaded photo primary
    const newPhotos = res.map((upload, index) => ({
      url: upload.url,
      isPrimary: currentId.photos?.length === 0 && index === 0, // First photo is primary by default
    }));
    
    // Add photos to current ID
    const updatedId = {
      ...currentId,
      isPrimary: true, // Ensure ID is marked as primary
      photos: [...(currentId.photos || []), ...newPhotos]
    };
    
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
            <div className="flex flex-col gap-2">
              {idPhotos.map((photo, idx) => (
                <div key={idx} className="relative">
                  <Dialog onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                    <DialogTrigger asChild>
                      <img
                        src={photo.url}
                        alt={`ID image ${idx + 1}`}
                        className="w-full h-auto cursor-pointer"
                        onClick={() => handleImageClick(idx)}
                      />
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>ID Image</DialogTitle>
                        <DialogDescription>Your identification document</DialogDescription>
                      </DialogHeader>
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <img src={photo.url} alt={`ID image ${idx + 1}`} className="w-full h-auto" />
                        </CardContent>
                      </Card>
                    </DialogContent>
                  </Dialog>
                  
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className='border border-gray-200 rounded-md flex justify-center items-center'>
            <span className="text-gray-500">ID photos will display here</span>
          </div>
        )}
      </div>
    </div>
  );
};

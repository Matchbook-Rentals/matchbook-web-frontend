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

interface IdentificationItem {
  idType: string;
  idNumber: string;
}

interface IdentificationProps {
  error?: { idType?: string; idNumber?: string };
}

const ID_TYPES = [
  { value: "driversLicense", label: "Driver\'s License" },
  { value: "passport", label: "Passport" }
];

export const Identification: React.FC = () => {
  const { ids, setIds, verificationImages, setVerificationImages, errors } = useApplicationStore();
  const error = errors.basicInfo.identification;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleUploadFinish = (res: UploadData[]) => {
    const newImages = res.map((upload) => ({ url: upload.url, category: 'Identification' as ImageCategory }));
    setVerificationImages([...verificationImages, ...newImages]);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const identificationImages = verificationImages.filter(img => img.category === 'Identification');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="idType" className={ApplicationItemLabelStyles}>Id Type</Label>
          <Select
            value={ids[0]?.idType}
            onValueChange={(value) => setIds([
              { ...ids[0], idType: value },
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
          <Label htmlFor="idNumber" className={ApplicationItemLabelStyles}>Id Number</Label>
          <Input
            id="idNumber"
            value={ids[0]?.idNumber}
            onChange={(e) => setIds([
              { ...ids[0], idNumber: e.target.value },
              ...ids.slice(1)
            ])}
            className={error?.idNumber ? "border-red-500" : ""}
          />
          {error?.idNumber && <p className="mt-1 text-red-500 text-sm">{error.idNumber}</p>}
        </div>
      </div>
      <Label className={ApplicationItemLabelStyles}>Please upload a photo of your Id</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className='border border-gray-200 rounded-md flex justify-center items-center'>
          <UploadButton<UploadData>
            endpoint="idUploader"
            onClientUploadComplete={handleUploadFinish}
            onUploadError={(error: Error) => alert(error.message)}
            className="mb-0"
            appearance={{ button: 'bg-parent text-[#404040] border-[#404040] border-2  sm:4/5 px-2 focus-within:ring-[#404040] data-[state="uploading"]:after:bg-[#404040]' }}
          />
        </div>
        {identificationImages.length > 0 && (
          <div className='border border-gray-300 rounded-md '>
            <div className="flex flex-wrap gap-2 justify-center">
              {identificationImages.map((img, idx) => (
                <Dialog key={idx} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                  <DialogTrigger asChild>
                    <img
                      src={img.url}
                      alt={`Id image ${idx + 1}`}
                      className="w-full h-auto cursor-pointer"
                      onClick={() => handleImageClick(idx)}
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Id Images</DialogTitle>
                      <DialogDescription>Use arrows to navigate between images</DialogDescription>
                    </DialogHeader>
                    <Carousel opts={{ loop: true, startIndex: selectedImageIndex ?? 0 }}>
                      <CarouselContent>
                        {identificationImages.map((image, index) => (
                          <CarouselItem key={index}>
                            <Card>
                              <CardContent className="flex aspect-square items-center justify-center p-6">
                                <img src={image.url} alt={`Id image ${index + 1}`} className="w-full h-auto" />
                              </CardContent>
                            </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

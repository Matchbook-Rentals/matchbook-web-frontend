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
  ids: IdentificationItem;
  setIds: React.Dispatch<React.SetStateAction<IdentificationItem>>;
  verificationImages: VerificationImage[];
  setVerificationImages: React.Dispatch<React.SetStateAction<VerificationImage[]>>;
}

const ID_TYPES = [
  { value: "driversLicense", label: "Driver\'s License" },
  { value: "passport", label: "Passport" }
];

export const Identification: React.FC<IdentificationProps> = ({ ids, setIds, verificationImages, setVerificationImages }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    const newImages = res.map((upload) => ({ url: upload.url, category: 'Identification' as ImageCategory }));
    setVerificationImages(prev => [...prev, ...newImages]);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Identification</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="idType">Select ID type</Label>
          <Select
            value={ids?.idType}
            onValueChange={(value) => setIds(prev => ({ ...prev, idType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map((type) => (
                <SelectItem key={type.value} className='cursor-pointer' value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number</Label>
          <Input
            id="idNumber"
            value={ids.idNumber}
            onChange={(e) => setIds(prev => ({ ...prev, idNumber: e.target.value }))}
          />
        </div>
      </div>
      <div className="mt-2">
        <Label>Please upload a photo of your ID</Label>
        <UploadButton
          endpoint="idUploader"
          onClientUploadComplete={handleUploadFinish}
          onUploadError={(error) => alert(error.message)}
          className="p-0 mt-5"
          appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand data-[state="uploading"]:after:bg-primaryBrand' }}
        />
      </div>
      {verificationImages.length > 0 && (
        <>
          <Label className="mt-4">ID image uploads</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {verificationImages.map((img, idx) => (
              <Dialog key={idx} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                <DialogTrigger asChild>
                  <img
                    src={img.url}
                    alt={`ID image ${idx + 1}`}
                    className="w-full h-auto cursor-pointer"
                    onClick={() => handleImageClick(idx)}
                  />
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>ID Images</DialogTitle>
                    <DialogDescription>Use arrows to navigate between images</DialogDescription>
                  </DialogHeader>
                  <Carousel opts={{ loop: true, startIndex: selectedImageIndex ?? 0 }}>
                    <CarouselContent>
                      {verificationImages.map((image, index) => (
                        <CarouselItem key={index}>
                          <Card>
                            <CardContent className="flex aspect-square items-center justify-center p-6">
                              <img src={image.url} alt={`ID image ${index + 1}`} className="w-full h-auto" />
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
        </>
      )}
    </div>
  );
};
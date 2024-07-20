import React, { useState } from 'react';
import { useFormContext, Controller } from "react-hook-form";
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

export const Identification: React.FC = () => {
  const { register, control, formState: { errors } } = useFormContext();
  const [idImages, setIdImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    const tempImageArray = res.map((upload) => ({ url: upload.url, key: upload.key }));
    setIdImages(prev => [...prev, ...tempImageArray]);
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
          <Controller
            name="identification.idType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className='cursor-pointer' value="driversLicense">Driver's License</SelectItem>
                  <SelectItem className='cursor-pointer' value="passport">Passport</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.identification?.idType && <p className="text-red-500">{errors.identification.idType.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number</Label>
          <Input id="idNumber" {...register("identification.idNumber")} />
          {errors.identification?.idNumber && <p className="text-red-500">{errors.identification.idNumber.message}</p>}
        </div>
      </div>
      <div className="mt-2">
        <Label>Please upload a photo of your ID</Label>
        <UploadButton
          endpoint="idUploader"
          onClientUploadComplete={handleUploadFinish}
          className="p-0 mt-5"
          appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand data-[state="uploading"]:after:bg-primaryBrand' }}
        />
      </div>
      {idImages.length > 0 && (
        <>
          <Label className="mt-4">ID image uploads</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {idImages.map((img, idx) => (
              <Dialog key={idx} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                <DialogTrigger asChild>
                  <img
                    src={img.url}
                    alt={img.key}
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
                      {idImages.map((image, index) => (
                        <CarouselItem key={index}>
                          <Card>
                            <CardContent className="flex aspect-square items-center justify-center p-6">
                              <img src={image.url} alt={image.key} className="w-full h-auto" />
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

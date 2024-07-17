import React, { useState } from 'react';
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadButton } from '@uploadthing/react';
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
import { Card, CardContent } from "@/components/ui/card";

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

export const Income: React.FC = () => {
  const { register, formState: { errors } } = useFormContext();
  const [incomeImages, setIncomeImages] = useState<{ url: string, key: string }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    const tempImageArray = res.map((upload) => ({ url: upload.url, key: upload.key }));
    setIncomeImages(prev => [...prev, ...tempImageArray]);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Income</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incomeSource">Income Source</Label>
          <Input id="incomeSource" {...register("income.source")} />
          {errors.income?.source && <p className="text-red-500">{(errors.income.source as { message: string }).message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyAmount">Monthly Amount</Label>
          <Input id="monthlyAmount" {...register("income.monthlyAmount")} />
          {errors.income?.monthlyAmount && <p className="text-red-500">{(errors.income.monthlyAmount as { message: string }).message}</p>}
        </div>
      </div>
      <div className="mt-2">
        <Label>Please upload proof of income</Label>
        <UploadButton
          endpoint="incomeUploader"
          onClientUploadComplete={handleUploadFinish}
          className="p-0 mt-5"
          appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand data-[state="uploading"]:after:bg-primaryBrand' }}
        />
        {incomeImages.length > 0 && (
          <>
            <Label>Proof of Income uploads</Label>
            <div className="grid grid-cols-2 gap-4">
              {incomeImages.map((img, idx) => (
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
                      <DialogTitle>Income Proof Images</DialogTitle>
                      <DialogDescription>Use arrows to navigate between images</DialogDescription>
                    </DialogHeader>
                    <Carousel opts={{loop: true, startIndex: selectedImageIndex ?? 0 }}>
                      <CarouselContent>
                        {incomeImages.map((image, index) => (
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
    </div>
  );
};

'use client'
import React, { useState, useEffect } from 'react';
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadButton } from '@uploadthing/react';
import { PlusCircle } from 'lucide-react';
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

interface VerificationImage {
  url: string;
}

interface IncomeItem {
  source: string;
  monthlyAmount: string;
  verificationImages: VerificationImage[];
}

interface Incomes {
  income: IncomeItem[];
}

export const Income: React.FC<{ setIncomes: React.Dispatch<React.SetStateAction<Incomes>> }> = ({ setIncomes }) => {
  const { register, formState: { errors }, watch } = useFormContext();
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([{ source: '', monthlyAmount: '', verificationImages: [] }]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const watchIncomes = watch('income');

  useEffect(() => {
    setIncomes({ income: incomeItems });
  }, [incomeItems, setIncomes]);

  const handleInputChange = (index: number, field: keyof IncomeItem, value: string) => {
    const updatedIncomes = incomeItems.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setIncomeItems(updatedIncomes);
  };

  const handleUploadFinish = (res: UploadData[]) => {
    const tempImageArray = res.map((upload) => ({ url: upload.url }));
    setIncomeItems([{ ...incomeItems[0], verificationImages: [...incomeItems[0].verificationImages, ...tempImageArray] }, ...incomeItems.slice(1)]);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const addIncome = (e) => {
    e.preventDefault()
    setIncomeItems([...incomeItems, { source: '', monthlyAmount: '', verificationImages: [] }]);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Income</h3>
      {incomeItems.map((item, index) => (
        <div key={index} className="mb-4 p-4 border rounded">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`incomeSource-${index}`}>Income Source {index + 1}</Label>
              <Input
                id={`incomeSource-${index}`}
                value={item.source}
                onChange={(e) => handleInputChange(index, 'source', e.target.value)}
                //{...register(`income.${index}.source`)}
              />
              {errors.income?.[index]?.source && <p className="text-red-500">{(errors.income[index].source as { message: string }).message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`monthlyAmount-${index}`}>Monthly Amount {index + 1}</Label>
              <Input
                type='number'
                id={`monthlyAmount-${index}`}
                value={item.monthlyAmount}
                onChange={(e) => handleInputChange(index, 'monthlyAmount', e.target.value)}
                //{...register(`income.${index}.monthlyAmount`)}
              />
              {errors.income?.[index]?.monthlyAmount && <p className="text-red-500">{(errors.income[index].monthlyAmount as { message: string }).message}</p>}
            </div>
          </div>
        </div>
      ))}
      <div className="mt-2">
        <Label>Please upload proof of income</Label>
        <UploadButton
          endpoint="incomeUploader"
          onUploadError={(error) => alert(error.message)}
          onClientUploadComplete={(res) => handleUploadFinish(res)}
          className="p-0 mt-5"
          appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand data-[state="uploading"]:after:bg-primaryBrand' }}
        />
        {incomeItems[0].verificationImages.length > 0 && (
          <>
            <Label>Proof of Income uploads</Label>
            <div className="grid grid-cols-2 gap-4">
              {incomeItems[0].verificationImages.map((img, imgIdx) => (
                <Dialog key={imgIdx} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                  <DialogTrigger asChild>
                    <img
                      src={img.url}
                      alt={`Income proof ${imgIdx + 1}`}
                      className="w-full h-auto cursor-pointer"
                      onClick={() => handleImageClick(imgIdx)}
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Income Proof Images</DialogTitle>
                      <DialogDescription>Use arrows to navigate between images</DialogDescription>
                    </DialogHeader>
                    <Carousel opts={{loop: true, startIndex: selectedImageIndex ?? 0 }}>
                      <CarouselContent>
                        {incomeItems[0].verificationImages.map((image, carouselIndex) => (
                          <CarouselItem key={carouselIndex}>
                            <Card>
                              <CardContent className="flex aspect-square items-center justify-center p-6">
                                <img src={image.url} alt={`Income proof ${carouselIndex + 1}`} className="w-full h-auto" />
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
      <Button  onClick={(e) => addIncome(e)} className="mt-4">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Another Income
      </Button>
    </div>
  );
};


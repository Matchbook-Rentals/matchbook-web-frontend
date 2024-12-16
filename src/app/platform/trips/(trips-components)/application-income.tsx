'use client'
import React, { useState, useEffect } from 'react';
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
  category: string;
}

interface IncomeItem {
  id?: string;
  applicationId?: string;
  source: string;
  monthlyAmount: string;
}

export const Income: React.FC<{
  incomes: IncomeItem[],
  setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>,
  verificationImages: VerificationImage[],
  setVerificationImages: React.Dispatch<React.SetStateAction<VerificationImage[]>>
}> = ({ incomes, setIncomes, verificationImages, setVerificationImages }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleInputChange = (index: number, field: keyof IncomeItem, value: string) => {
    const updatedIncomes = incomes.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setIncomes(updatedIncomes);
  };

  const handleUploadFinish = (res: UploadData[]) => {
    const newImages = res.map((upload) => ({ url: upload.url, category: 'Income' }));
    setVerificationImages([...verificationImages, ...newImages]);
  };

  const handleImageClick = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
  };

  const addIncome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newIncome: IncomeItem = { source: '', monthlyAmount: '' };
    setIncomes([...incomes, newIncome]);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Income</h3>
      {incomes.map((item, index) => (
        <div key={index} className="mb-4 p-4 border rounded">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`incomeSource-${index}`}>Income Source {index + 1}</Label>
              <Input
                id={`incomeSource-${index}`}
                value={item.source}
                onChange={(e) => handleInputChange(index, 'source', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`monthlyAmount-${index}`}>Monthly Amount {index + 1}</Label>
              <Input
                type='number'
                id={`monthlyAmount-${index}`}
                value={item.monthlyAmount}
                onChange={(e) => handleInputChange(index, 'monthlyAmount', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4">
        <Button onClick={(e) => addIncome(e)} className="w-full mb-4">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Another Income
        </Button>
        <Label className='text-lg text-center block mb-2'>Please upload proof of income</Label>
        <UploadButton
          endpoint="incomeUploader"
          onUploadError={(error) => alert(error.message)}
          onClientUploadComplete={(res) => handleUploadFinish(res)}
          className="p-0 mt-2"
          appearance={{ button: 'bg-parent border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand data-[state="uploading"]:after:bg-primaryBrand' }}
        />
      </div>

      {verificationImages.length > 0 && (
        <>
          <Label>Proof of Income uploads</Label>
          <div className="grid grid-cols-2 gap-4">
            {verificationImages.filter(img => img.category === 'Income').map((img, imgIdx) => (
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
                  <Carousel opts={{ loop: true, startIndex: selectedImageIndex ?? 0 }}>
                    <CarouselContent>
                      {verificationImages.filter(img => img.category === 'Income').map((image, carouselIndex) => (
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
  );
};

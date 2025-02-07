'use client'
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadButton } from '@uploadthing/react';
import { PlusCircle, X } from 'lucide-react';
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
import CurrencyInput from "@/components/ui/currency-input";
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
  category: string;
}

interface IncomeItem {
  id?: string;
  applicationId?: string;
  source: string;
  monthlyAmount: string;
}

export const Income: React.FC = () => {
  const {
    incomes,
    setIncomes,
    verificationImages,
    setVerificationImages,
    errors
  } = useApplicationStore();

  const error = errors.income;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleInputChange = (index: number, field: 'source' | 'monthlyAmount', value: string) => {
    const updatedIncomes = incomes.map((item, i) => {
      if (i === index) {
        const finalValue = field === 'monthlyAmount' && value === '$' ? '' : value;
        return { ...item, [field]: finalValue };
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
    setIncomes([...incomes, { source: '', monthlyAmount: '' }]);
  };

  const handleDelete = (index: number) => {
    if (incomes.length > 1) {
      setIncomes(incomes.filter((_, i) => i !== index));
    }
  };

  const incomeImages = verificationImages.filter(img => img.category === 'Income');

  return (
    <div>
      {incomes.map((item, index) => (
        <div key={index} className="mb-4 p-4 border rounded relative">
          {index > 0 && (
            <button
              onClick={() => handleDelete(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={ApplicationItemLabelStyles} htmlFor={`incomeSource-${index}`}>
                Income Source {index + 1}
              </Label>
              <Input
                id={`incomeSource-${index}`}
                value={item.source}
                onChange={(e) => handleInputChange(index, 'source', e.target.value)}
                className={error?.source?.[index] ? "border-red-500" : ""}
              />
              {error?.source?.[index] && (
                <p className="mt-1 text-red-500 text-sm">{error.source[index]}</p>
              )}
            </div>
            <div className="space-y-2" onClick={() => console.log(item)}>
              <Label className={ApplicationItemLabelStyles} htmlFor={`monthlyAmount-${index}`}>
                Monthly Amount {index + 1}
              </Label>
              <CurrencyInput
                id={`monthlyAmount-${index}`}
                label=""
                value={item.monthlyAmount}
                onChange={(value) => handleInputChange(index, 'monthlyAmount', value)}
                className={`w-full ${error?.monthlyAmount?.[index] ? "border-red-500" : ""}`}
                disabled={!item.source.trim()}
              />
              {error?.monthlyAmount?.[index] && (
                <p className="mt-1 text-red-500 text-sm">{error.monthlyAmount[index]}</p>
              )}
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

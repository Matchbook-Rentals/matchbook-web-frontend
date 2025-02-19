'use client'
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadButton } from '@uploadthing/react';
import { PlusCircle, X, Trash } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationItemLabelStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';
import { deleteIncome } from '@/app/actions/applications';
import { UploadIcon } from '@radix-ui/react-icons';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

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
  const {
    incomes,
    setIncomes,
    verificationImages,
    setVerificationImages,
    errors
  } = useApplicationStore();

  const error = errors.income;

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

  const handleIncomeUploadFinish = (index: number) => (res: UploadData[]) => {
    if (res && res.length > 0) {
      const imageUrl = res[0].url;
      const updatedIncomes = incomes.map((income, i) =>
        i === index ? { ...income, imageUrl } : income
      );
      setIncomes(updatedIncomes);
    }
  };

  const addIncome = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIncomes([...incomes, {  source: '', monthlyAmount: '', imageUrl: '' }]);
  };

  const handleDelete = (index: number) => {
    if (incomes.length > 1) {
      deleteIncome(incomes[index].id || '');
      setIncomes(incomes.filter((_, i) => i !== index));
    }
  };

  const clearIncomeImage = (index: number) => {
    const updatedIncomes = incomes.map((income, i) =>
      i === index ? { ...income, imageUrl: '' } : income
    );
    setIncomes(updatedIncomes);
  };

  const incomeImages = verificationImages.filter(img => img.category === 'Income');

  // Modified function to format currency without cents
  const formatCurrency = (value: string) => {
    const numberValue = Number(value.replace(/[^0-9.-]+/g, ""));
    if (isNaN(numberValue)) {
      return value;
    }
    return numberValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0, // Remove cents
      maximumFractionDigits: 0, // Remove cents
    });
  };

  // Function to handle changes in the monthly amount, removing non-numeric characters
  const handleMonthlyAmountChange = (index: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    handleInputChange(index, 'monthlyAmount', numericValue);
  };

  return (
    <div onClick={() => console.log(incomes)}>
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
          <div className="grid grid-cols-3 gap-6 px-2">
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
              <div className="space-y-2">
                <Label className={ApplicationItemLabelStyles} htmlFor={`monthlyAmount-${index}`}>
                  Monthly Amount {index + 1}
                </Label>
                <Input
                  id={`monthlyAmount-${index}`}
                  value={formatCurrency(item.monthlyAmount)}
                  onChange={(e) => handleMonthlyAmountChange(index, e.target.value)}
                  className={`w-full ${error?.monthlyAmount?.[index] ? "border-red-500" : ""}`}
                />
                {error?.monthlyAmount?.[index] && (
                  <p className="mt-1 text-red-500 text-sm">{error.monthlyAmount[index]}</p>
                )}
              </div>
            <div className="space-y-2 pr-2 ">
              <Label className={ApplicationItemLabelStyles} htmlFor={`incomeUpload-${index}`}>Income Proof</Label>
              {item.imageUrl ? (
                <div className="flex items-center space-x-2 justify-start w-full">
                  <Dialog>
                    <DialogTrigger asChild>
                      <img src={item.imageUrl} alt="Income Proof" className="h-12 w-36 rounded cursor-pointer" />
                    </DialogTrigger>
                    <DialogContent className="p-4 bg-white rounded pt-16 max-h-[90vh] overflow-auto">
                      <img src={item.imageUrl} alt="Income Proof" className="max-h-[80vh] object-contain" />
                    </DialogContent>
                  </Dialog>
                  <button type="button" onClick={() => clearIncomeImage(index)} className="p-1 ">
                    <Trash className="h-5 w-5 text-[#404040]" />
                  </button>
                </div>
              ) : (
                <UploadButton<UploadData, unknown>
                  endpoint="incomeUploader"
                  content={{
                    button({ ready }) {
                      return <UploadIcon className="h-5 w-5 text-gray-500" />;
                    }
                  }}
                  onUploadError={(error) => alert(error.message)}
                  onClientUploadComplete={(res) => handleIncomeUploadFinish(index)(res)}
                  className="p-0 "
                  text="Upload"
                  appearance={{
                    button:
                      'bg-parent border-[#404040] text-[#404040] border w-fit px-2 focus-within:ring-[#404040] data-[state="uploading"]:after:bg-gray-200' +
                      (error?.imageUrl?.[index] ? " border-red-500" : ""),
                    allowedContent: 'hidden',
                    container: 'w-fit'
                  }}
                />
              )}
              {error?.imageUrl?.[index] && (
                <p className="mt-1 text-red-500 text-sm">{error.imageUrl[index]}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="my-4 space-y-4">
        <Button onClick={(e) => addIncome(e)} className="w-full mb-4">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Another Income
        </Button>
      </div>
    </div>
  );
};

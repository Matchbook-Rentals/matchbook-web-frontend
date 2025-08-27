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
    <div className="flex flex-col items-end justify-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        {incomes.map((item, index) => (
          <div key={index} className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* Row 1: Income Source + Monthly Amount */}
            <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                      <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Income Source {index + 1}
                      </Label>
                      {index > 0 && (
                        <button
                          onClick={() => handleDelete(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <Input
                      id={`incomeSource-${index}`}
                      value={item.source}
                      onChange={(e) => handleInputChange(index, 'source', e.target.value)}
                      placeholder="Enter your Income Source"
                      className={`flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] ${error?.source?.[index] ? "border-red-500" : "border-[#d0d5dd]"}`}
                    />
                    {error?.source?.[index] && (
                      <p className="mt-1 text-red-500 text-sm">{error.source[index]}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                    <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Monthly Amount
                    </Label>
                  </div>

                  <Input
                    id={`monthlyAmount-${index}`}
                    value={formatCurrency(item.monthlyAmount)}
                    onChange={(e) => handleMonthlyAmountChange(index, e.target.value)}
                    placeholder="Enter Monthly Amount"
                    className={`flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] ${error?.monthlyAmount?.[index] ? "border-red-500" : "border-[#d0d5dd]"}`}
                  />
                  {error?.monthlyAmount?.[index] && (
                    <p className="mt-1 text-red-500 text-sm">{error.monthlyAmount[index]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Income Proof Upload */}
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start justify-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Income Proof
                    </Label>

                    <div className="relative self-stretch font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-neutralneutral-600 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                      Upload Income proof Document
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                      {item.imageUrl ? (
                        <div className="flex items-center space-x-2 justify-start w-full p-4 bg-white rounded-xl border border-solid border-[#d0d5dd]">
                          <Dialog>
                            <DialogTrigger asChild>
                              <img src={item.imageUrl} alt="Income Proof" className="h-12 w-36 rounded cursor-pointer" />
                            </DialogTrigger>
                            <DialogContent className="p-4 bg-white rounded pt-16 max-h-[90vh] overflow-auto">
                              <img src={item.imageUrl} alt="Income Proof" className="max-h-[80vh] object-contain" />
                            </DialogContent>
                          </Dialog>
                          <button type="button" onClick={() => clearIncomeImage(index)} className="p-1">
                            <Trash className="h-5 w-5 text-[#404040]" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col h-[140px] items-center justify-center gap-[35px] px-[100px] py-[21px] relative self-stretch w-full bg-white rounded-xl border border-dashed border-[#036e49] cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="inline-flex flex-col items-center justify-center gap-3 relative flex-[0_0_auto]">
                            <UploadButton<UploadData, unknown>
                              endpoint="incomeUploader"
                              content={{
                                button({ ready }) {
                                  return <UploadIcon className="relative w-8 h-8 text-[#036e49]" />;
                                }
                              }}
                              onUploadError={(error) => alert(error.message)}
                              onClientUploadComplete={(res) => handleIncomeUploadFinish(index)(res)}
                              className="p-0"
                              appearance={{
                                button: 'bg-transparent border-none p-0 hover:bg-transparent',
                                allowedContent: 'hidden',
                                container: 'w-fit'
                              }}
                            />

                            <div className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
                              <div className="relative w-fit mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#717680] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                                Drag and drop file or
                              </div>

                              <Button
                                variant="link"
                                className="relative w-fit mt-[-1.00px] font-text-label-small-medium font-[number:var(--text-label-small-medium-font-weight)] text-[#0b6969] text-[length:var(--text-label-small-medium-font-size)] tracking-[var(--text-label-small-medium-letter-spacing)] leading-[var(--text-label-small-medium-line-height)] [font-style:var(--text-label-small-medium-font-style)] p-0 h-auto underline"
                              >
                                Browse
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="relative flex-1 mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-neutralneutral-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                          Supported formats: PNG, JPG, DOC
                        </div>

                        <div className="relative w-fit mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-neutralneutral-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                          Maximum size: 50MB
                        </div>
                      </div>
                    </div>
                    {error?.imageUrl?.[index] && (
                      <p className="mt-1 text-red-500 text-sm">{error.imageUrl[index]}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Add separator between income entries except for the last one */}
            {index < incomes.length - 1 && (
              <div className="w-full h-px bg-[#d0d5dd] my-4"></div>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={(e) => addIncome(e)}
        variant="link"
        className="inline-flex items-center justify-center gap-2 px-0 py-3 relative flex-[0_0_auto] rounded-lg overflow-hidden h-auto"
      >
        <PlusCircle className="relative w-6 h-6 text-[#3c8787]" />

        <div className="inline-flex items-center justify-center px-0.5 py-0 relative flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#3c8787] text-lg tracking-[0] leading-7 underline whitespace-nowrap">
            Add Another Income
          </div>
        </div>
      </Button>
    </div>
  );
};

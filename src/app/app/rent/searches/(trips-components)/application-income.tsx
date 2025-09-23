'use client'
import React, { useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadButton } from '@/app/utils/uploadthing';
import { PlusCircle, X, Trash, Loader2, Camera } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationItemLabelStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';
import { deleteIncome, deleteIncomeProof } from '@/app/actions/applications';
import { UploadIcon } from '@radix-ui/react-icons';
import { Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import { SecureFileViewer } from '@/components/secure-file-viewer';
import BrandModal from '@/components/BrandModal';

interface UploadData {
  name: string;
  size: number;
  key: string;
  serverData: {
    uploadedBy: string;
    fileUrl: string;
    fileKey?: string;
    fileName?: string;
    uploadType?: string;
    isPrivate?: boolean;
  };
  url: string;
  customId: string | null;
  type: string;
}

interface IncomeProps {
  inputClassName?: string;
  isMobile?: boolean;
}

export const Income: React.FC<IncomeProps> = ({ inputClassName, isMobile = false }) => {
  const { toast } = useToast();
  const {
    incomes,
    setIncomes,
    verificationImages,
    setVerificationImages,
    errors,
    fieldErrors,
    saveField,
    validateField,
    setFieldError,
    clearFieldError
  } = useApplicationStore();

  const error = errors.income;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // State for deletion modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{ index: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for income source deletion
  const [deleteIncomeModalOpen, setDeleteIncomeModalOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<number | null>(null);
  const [isDeletingIncome, setIsDeletingIncome] = useState(false);


  const handleInputChange = (index: number, field: 'source' | 'monthlyAmount', value: string) => {
    const fieldPath = `incomes.${index}.${field}`;
    
    // Update local state immediately
    const updatedIncomes = incomes.map((item, i) => {
      if (i === index) {
        const finalValue = field === 'monthlyAmount' && value === '$' ? '' : value;
        return { ...item, [field]: finalValue };
      }
      return item;
    });
    setIncomes(updatedIncomes);
    
    // Validate only (no auto-save)
    const validationError = validateField(fieldPath, value);
    if (validationError) {
      setFieldError(fieldPath, validationError);
      if (isDevelopment) {
        console.log(`[Income] Validation error for ${fieldPath}:`, validationError);
      }
    } else {
      clearFieldError(fieldPath);
      if (isDevelopment) {
        console.log(`[Income] Field ${fieldPath} validated successfully (no auto-save)`);
      }
    }
  };

  const handleIncomeUploadFinish = (index: number) => async (res: UploadData[]) => {
    if (res && res.length > 0) {
      const upload = res[0];
      const updatedIncomes = incomes.map((income, i) =>
        i === index ? { 
          ...income, 
          fileKey: upload.key || upload.serverData?.fileKey,
          customId: upload.customId,
          fileName: upload.name || upload.serverData?.fileName,
          imageUrl: undefined // Don't store public URL for security
        } : income
      );
      setIncomes(updatedIncomes);
      
      // IMMEDIATELY save the income proof to the backend
      const fieldPath = `incomes.${index}.fileKey`;
      if (isDevelopment) {
        console.log(`[Income] Saving income proof immediately for ${fieldPath}`);
      }
      
      const fileKey = upload.key || upload.serverData?.fileKey;
      const result = await saveField(fieldPath, fileKey, { checkCompletion: false });
      
      if (result.success) {
        toast({
          title: "Income Proof Uploaded",
          description: `Successfully uploaded proof for Income Source ${index + 1}`,
          duration: 3000,
        });
      } else {
        console.error(`[Income] Failed to save income proof:`, result.error);
        toast({
          title: "Save Failed",
          description: "Proof uploaded but failed to save. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  const addIncome = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIncomes([...incomes, {  source: '', monthlyAmount: '', imageUrl: '' }]);
  };

  const handleDelete = (index: number) => {
    // Prevent deletion if this would leave no income sources
    if (incomes.length <= 1) {
      return; // Don't allow deletion of the last income source
    }
    setIncomeToDelete(index);
    setDeleteIncomeModalOpen(true);
  };
  
  // Handle income source deletion confirmation
  const handleConfirmDeleteIncome = async () => {
    if (incomeToDelete === null) return;
    
    setIsDeletingIncome(true);
    const income = incomes[incomeToDelete];
    
    try {
      // Only call server action if income has an ID (exists in database)
      if (income.id) {
        await deleteIncome(income.id);
      }
      
      // Update local state
      setIncomes(incomes.filter((_, i) => i !== incomeToDelete));
      
      toast({
        title: "Income Source Removed",
        description: `Income Source ${incomeToDelete + 1} has been removed`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error removing income source:', error);
      toast({
        title: "Error",
        description: "Failed to remove income source",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsDeletingIncome(false);
      setDeleteIncomeModalOpen(false);
      setIncomeToDelete(null);
    }
  };

  const clearIncomeImage = (index: number) => {
    // Show confirmation modal
    setPhotoToDelete({ index });
    setDeleteModalOpen(true);
  };
  
  // Handle income proof deletion confirmation
  const handleDeleteIncomeProof = async () => {
    if (!photoToDelete) return;
    
    setIsDeleting(true);
    const { index } = photoToDelete;
    const income = incomes[index];
    
    try {
      // Only call server action if income has an ID (exists in database)
      if (income.id) {
        const result = await deleteIncomeProof(income.id);
        
        if (result.success) {
          // Update local state to reflect the deletion
          const updatedIncomes = incomes.map((inc, i) =>
            i === index ? { ...inc, imageUrl: '', fileKey: undefined, customId: undefined, fileName: undefined } : inc
          );
          setIncomes(updatedIncomes);
          
          toast({
            title: "Proof Removed",
            description: `Income proof for Source ${index + 1} has been removed`,
            duration: 3000,
          });
        } else {
          toast({
            title: "Removal Failed",
            description: result.error || "Failed to remove proof",
            variant: "destructive",
            duration: 4000,
          });
        }
      } else {
        // For new incomes not yet saved to database, just clear local state
        const updatedIncomes = incomes.map((inc, i) =>
          i === index ? { ...inc, imageUrl: '', fileKey: undefined, customId: undefined, fileName: undefined } : inc
        );
        setIncomes(updatedIncomes);
        
        toast({
          title: "Proof Removed",
          description: `Income proof for Source ${index + 1} has been removed`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error removing income proof:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setPhotoToDelete(null);
    }
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
    <>
    <div className="flex flex-col items-end justify-center gap-8 relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        {incomes.map((item, index) => (
          <div key={index} className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* Row 1: Income Source + Monthly Amount */}
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
              <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-start  relative ">
                      <Label className="relative w-fit  [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Income Source {index + 1}
                      </Label>
                      {incomes.length > 1 ? (
                        <button
                          onClick={() => handleDelete(index)}
                          className="ml-2 pt-[1px] px-4 text-[#404040] hover:text-red-500"
                          type="button"
                          title="Remove this income source"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      ) : (
                        <span 
                          className="ml-2 pt-[1px] px-4 text-gray-300 cursor-not-allowed"
                          title="At least one income source is required"
                        >
                          <Trash className="h-4 w-4" />
                        </span>
                      )}
                    </div>

                    <Input
                      id={`incomeSource-${index}`}
                      value={item.source}
                      onChange={(e) => handleInputChange(index, 'source', e.target.value)}
                      placeholder="Enter your Income Source"
                      className={`${inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`} ${fieldErrors[`incomes.${index}.source`] || error?.source?.[index] ? "border-red-500" : ""}`}
                    />
                    {(fieldErrors[`incomes.${index}.source`] || error?.source?.[index]) && (
                      <p className="mt-1 text-red-500 text-sm">{fieldErrors[`incomes.${index}.source`] || error.source?.[index]}</p>
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
                    className={`${inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`} ${fieldErrors[`incomes.${index}.monthlyAmount`] || error?.monthlyAmount?.[index] ? "border-red-500" : ""}`}
                  />
                  {(fieldErrors[`incomes.${index}.monthlyAmount`] || error?.monthlyAmount?.[index]) && (
                    <p className="mt-1 text-red-500 text-sm">{fieldErrors[`incomes.${index}.monthlyAmount`] || error.monthlyAmount?.[index]}</p>
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
                      {(item.imageUrl || item.fileKey) ? (
                        <div className="flex items-center space-x-2 justify-start w-full p-4 bg-white rounded-xl border border-solid border-[#d0d5dd]">
                          <SecureFileViewer
                            fileKey={item.fileKey}
                            customId={item.customId}
                            fileName={item.fileName || 'Income Document'}
                            fileType="auto"
                            className="h-12 w-36"
                            // Support backward compatibility with direct URLs
                            fallbackUrl={item.imageUrl}
                          />
                          <button type="button" onClick={() => clearIncomeImage(index)} className="p-1 text-red-500 hover:text-red-700">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <UploadButton<UploadData, unknown>
                          endpoint="incomeUploader"
                          config={{
                            mode: "auto",
                            ...(isMobile && {
                              input: {
                                accept: "image/*,application/pdf",
                                capture: "environment"
                              }
                            })
                          }}
                          className="uploadthing-custom w-full"
                          appearance={{
                            button: `flex ${isMobile ? 'flex-row gap-3 px-4 py-4' : 'flex-col h-[140px] gap-[35px] px-[100px] py-[21px]'} items-center justify-center relative self-stretch w-full bg-white rounded-xl border border-dashed border-[#036e49] cursor-pointer hover:bg-gray-50 transition-colors text-inherit`,
                            allowedContent: "hidden",
                          }}
                          onUploadBegin={(name) => {
                            console.log('🚀 Income upload begin for file:', name);
                          }}
                          onUploadProgress={(progress) => {
                            console.log('📊 Income upload progress:', progress, '%');
                          }}
                          onUploadAborted={() => {
                            console.warn('⚠️ Income upload was aborted');
                            toast({
                              title: "Upload Cancelled",
                              description: "Income document upload was cancelled or timed out",
                              variant: "destructive"
                            });
                          }}
                          content={{
                            button: ({ ready, isUploading }) => (
                              <div className={`inline-flex ${isMobile ? 'flex-row' : 'flex-col'} items-center justify-center gap-3 relative flex-[0_0_auto]`}>
                                {isUploading ? (
                                  <Loader2 className={`relative ${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-[#036e49] animate-spin`} />
                                ) : (
                                  isMobile ? (
                                    <Camera className="w-6 h-6 text-[#036e49]" />
                                  ) : (
                                    <UploadIcon className="w-8 h-8 text-[#036e49]" />
                                  )
                                )}

                                <div className="flex items-center gap-2 relative flex-[0_0_auto]">
                                  <div className="relative w-fit mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#717680] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                                    {isUploading ? "Uploading..." : (isMobile ? "Upload document or photo" : "Drag and drop file or")}
                                  </div>

                                  {!isUploading && !isMobile && (
                                    <span className="relative w-fit mt-[-1.00px] font-text-label-small-medium font-[number:var(--text-label-small-medium-font-weight)] text-[#0b6969] text-[length:var(--text-label-small-medium-font-size)] tracking-[var(--text-label-small-medium-letter-spacing)] leading-[var(--text-label-small-medium-line-height)] [font-style:var(--text-label-small-medium-font-style)] underline">
                                      Browse
                                    </span>
                                  )}
                                </div>
                              </div>
                            ),
                          }}
                          onBeforeUploadBegin={(files) => {
                            console.log('📤 Income onBeforeUploadBegin called with', files.length, 'files');
                            
                            // Validate files
                            const maxFiles = 1;
                            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                            const maxSize = 50 * 1024 * 1024; // 50MB
                            
                            const errors: string[] = [];
                            
                            if (files.length > maxFiles) {
                              errors.push(`You can only upload ${maxFiles} file at a time.`);
                            }
                            
                            files.forEach((file) => {
                              if (!allowedTypes.includes(file.type.toLowerCase())) {
                                const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'unknown';
                                errors.push(`File "${file.name}" has unsupported type "${fileExtension}". Please use PNG, JPG, PDF, or DOC files only.`);
                              }
                              
                              if (file.size > maxSize) {
                                errors.push(`File "${file.name}" is too large. Maximum size is 50MB.`);
                              }
                            });
                            
                            if (errors.length > 0) {
                              errors.forEach((error, index) => {
                                setTimeout(() => {
                                  toast({
                                    title: "Upload Error",
                                    description: error,
                                    variant: "destructive"
                                  });
                                }, index * 100);
                              });
                              return [];
                            }
                            
                            return files;
                          }}
                          onClientUploadComplete={(res) => {
                            console.log('✅ Income upload complete:', res);
                            handleIncomeUploadFinish(index)(res);
                            
                            toast({
                              title: "Upload Successful",
                              description: "Income document uploaded successfully.",
                              variant: "default"
                            });
                          }}
                          onUploadError={(error) => {
                            console.error("💥 Income upload error:", error);
                            toast({
                              title: "Upload Error",
                              description: error.message || "Failed to upload income document. Please try again.",
                              variant: "destructive"
                            });
                          }}
                        />
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
    
    {/* Delete Confirmation Modal */}
    <BrandModal
      isOpen={deleteModalOpen}
      onOpenChange={setDeleteModalOpen}
      heightStyle="!top-[30vh]"
      className="max-w-md"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Remove Income Proof</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove this income proof? You can upload a new one at any time.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setDeleteModalOpen(false);
              setPhotoToDelete(null);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteIncomeProof}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove Proof'
            )}
          </Button>
        </div>
      </div>
    </BrandModal>
    
    {/* Delete Income Source Confirmation Modal */}
    <BrandModal
      isOpen={deleteIncomeModalOpen}
      onOpenChange={setDeleteIncomeModalOpen}
      heightStyle="!top-[30vh]"
      className="max-w-md"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Remove Income Source</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove this income source? This will also delete any uploaded proof documents.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setDeleteIncomeModalOpen(false);
              setIncomeToDelete(null);
            }}
            disabled={isDeletingIncome}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDeleteIncome}
            disabled={isDeletingIncome}
          >
            {isDeletingIncome ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove Income Source'
            )}
          </Button>
        </div>
      </div>
    </BrandModal>
    </>
  );
};

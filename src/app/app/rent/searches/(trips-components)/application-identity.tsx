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
import { Upload, Loader2 } from 'lucide-react';
import { ImageCategory } from '@prisma/client';
import { useApplicationStore } from '@/stores/application-store';
import { useToast } from "@/components/ui/use-toast";

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

interface IDPhoto {
  id?: string;
  url: string;
  isPrimary: boolean;
}

interface IdentificationItem {
  id: string;
  idType: string;
  idNumber: string;
  isPrimary: boolean;
  idPhotos?: IDPhoto[];
}

interface IdentificationProps {
  error?: {
    idType?: string;
    idNumber?: string;
    isPrimary?: string;
    idPhotos?: string;
    primaryPhoto?: string;
  };
}

const ID_TYPES = [
  { value: "driversLicense", label: "Driver\'s License" },
  { value: "passport", label: "Passport" }
];

export const Identification: React.FC = () => {
  const { toast } = useToast();
  const { ids, setIds, verificationImages, setVerificationImages, errors } = useApplicationStore();
  const error = errors.identification;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Get current ID (or first ID) - always make it primary
  const currentId = ids[0] || { id: '', idType: '', idNumber: '', isPrimary: true, idPhotos: [] };

  // If not already primary, make it primary
  if (!currentId.isPrimary) {
    currentId.isPrimary = true;
  }

  const handleUploadFinish = (res: UploadData[]) => {
    // Check if we have existing photos
    const hasExistingPhotos = currentId.idPhotos && currentId.idPhotos.length > 0;

    // Convert uploaded images to IDPhotos
    const newPhotos = res.map((upload, index) => ({
      url: upload.url,
      // Only set as primary if there are no existing photos and this is the first uploaded photo
      isPrimary: !hasExistingPhotos && index === 0,
    }));

    // Add photos to current ID without creating a new ID
    const updatedId = {
      ...currentId,
      isPrimary: true, // Ensure ID is marked as primary
      idPhotos: [...(currentId.idPhotos || []), ...newPhotos]
    };

    // Only update the current ID, keeping all other IDs unchanged
    setIds([updatedId, ...ids.slice(1)]);

    // Also keep old functionality for backward compatibility
    const newImages = res.map((upload) => ({
      id: upload.customId || '',
      url: upload.url,
      category: 'Identification' as ImageCategory,
      applicationId: ''
    }));
    setVerificationImages([...verificationImages, ...newImages]);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Find ID photos either from new schema or old schema for backward compatibility
  const idPhotos = currentId.idPhotos?.length ?
    currentId.idPhotos :
    verificationImages
      .filter(img => img.category === 'Identification')
      .map((img, idx) => ({
        url: img.url,
        isPrimary: idx === 0 // Make first one primary by default
      }));

  return (
    <Card className="h-[534px] w-full p-6 bg-neutral-50 rounded-xl border-0">
      <CardContent className="p-0 flex flex-col gap-8 h-full">
        <div className="flex flex-col items-start gap-5 w-full">
          <h2 className="[font-family:'Poppins',Helvetica] font-medium text-gray-3800 text-xl tracking-[-0.40px] leading-normal">
            Identification
          </h2>

          <div className="flex items-start gap-5 w-full">
            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="flex flex-col items-start gap-1.5 w-full">
                  <div className="inline-flex items-center gap-1.5">
                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      ID Type
                    </Label>
                    <img
                      className="w-[5.2px] h-1.5"
                      alt="Star"
                      src="/star-6.svg"
                    />
                  </div>

                  <Select>
                    <SelectTrigger className="h-12 px-3 py-2 bg-white rounded-lg border border-[#d0d5dd] shadow-shadows-shadow-xs">
                      <SelectValue
                        placeholder="Select ID Type"
                        className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="inline-flex items-center gap-1.5">
                  <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                    ID Number
                  </Label>
                  <img
                    className="w-[5.2px] h-1.5"
                    alt="Star"
                    src="/star-6.svg"
                  />
                </div>

                <Input
                  placeholder="Enter ID Number"
                  className="h-12 px-3 py-2 bg-white rounded-lg border border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                />
              </div>
            </div>
          </div>

          <div className="h-[337px] flex items-center gap-5 w-full">
            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="flex flex-col items-start gap-1.5 w-full">
                  <div className="inline-flex flex-col items-start justify-center gap-1.5">
                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Please upload A photo&nbsp;&nbsp;of your ID
                    </Label>
                    <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-neutralneutral-600 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                      Upload ID (Front)
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-[18px] w-full">
                    <div className="flex flex-col items-start gap-3 w-full">
                      <UploadButton<UploadData, unknown>
                        endpoint="identificationUploader"
                        config={{
                          mode: "auto"
                        }}
                        className="uploadthing-custom w-full"
                        appearance={{
                          button: "flex flex-col h-[140px] box-border items-center justify-center gap-[35px] px-[100px] py-[21px] w-full bg-white rounded-xl border border-dashed border-[#036e49] cursor-pointer hover:bg-gray-50 transition-colors text-inherit",
                          allowedContent: "hidden",
                        }}
                        onUploadBegin={(name) => {
                          console.log('🚀 ID upload begin for file:', name);
                        }}
                        onUploadProgress={(progress) => {
                          console.log('📊 ID upload progress:', progress, '%');
                        }}
                        onUploadAborted={() => {
                          console.warn('⚠️ ID upload was aborted');
                          toast({
                            title: "Upload Cancelled",
                            description: "ID upload was cancelled or timed out",
                            variant: "destructive"
                          });
                        }}
                        content={{
                          button: ({ ready, isUploading }) => (
                            <div className="inline-flex flex-col items-center justify-center gap-3">
                              {isUploading ? (
                                <Loader2 className="w-8 h-8 text-secondaryBrand animate-spin" />
                              ) : (
                                <Upload className="w-8 h-8 text-secondaryBrand" />
                              )}

                              <div className="flex items-center gap-2 w-full">
                                <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#717680] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                                  {isUploading ? "Uploading..." : "Drag and drop file or"}
                                </div>
                                {!isUploading && (
                                  <span className="font-text-label-small-medium font-[number:var(--text-label-small-medium-font-weight)] text-[#0b6969] text-[length:var(--text-label-small-medium-font-size)] tracking-[var(--text-label-small-medium-letter-spacing)] leading-[var(--text-label-small-medium-line-height)] [font-style:var(--text-label-small-medium-font-style)] underline">
                                    Browse
                                  </span>
                                )}
                              </div>
                            </div>
                          ),
                        }}
                        onBeforeUploadBegin={(files) => {
                          console.log('📤 ID onBeforeUploadBegin called with', files.length, 'files');
                          
                          // Validate files
                          const maxFiles = 5;
                          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                          const maxSize = 50 * 1024 * 1024; // 50MB
                          
                          const errors: string[] = [];
                          
                          if (files.length > maxFiles) {
                            errors.push(`You can only upload up to ${maxFiles} files at once.`);
                          }
                          
                          files.forEach((file) => {
                            if (!allowedTypes.includes(file.type.toLowerCase())) {
                              const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'unknown';
                              errors.push(`File "${file.name}" has unsupported type "${fileExtension}". Please use PNG or JPG files only.`);
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
                          console.log('✅ ID upload complete:', res);
                          handleUploadFinish(res);
                          
                          toast({
                            title: "Upload Successful",
                            description: `Successfully uploaded ${res.length} ID photo${res.length !== 1 ? 's' : ''}.`,
                            variant: "default"
                          });
                        }}
                        onUploadError={(error) => {
                          console.error("💥 ID upload error:", error);
                          toast({
                            title: "Upload Error",
                            description: error.message || "Failed to upload ID photos. Please try again.",
                            variant: "destructive"
                          });
                        }}
                      />

                      <div className="flex items-center gap-1 w-full">
                        <div className="flex-1 font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-gray-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                          Supported formats: PNG, JPG
                        </div>
                        <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-gray-400 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                          Maximum size: 50MB
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex flex-col items-start gap-1.5 pt-4 pb-0 px-0 w-full">
                <div className="flex flex-col items-start gap-[18px] w-full">
                  <div className="flex flex-col items-start gap-3 w-full">
                    <div className="flex flex-col h-[140px] box-border items-center justify-center gap-[35px] px-[100px] py-[21px] w-full bg-white rounded-xl border border-solid border-[#e7f0f0]">
                      <div className="inline-flex flex-col items-center justify-center gap-3">
                        <svg
                          className="w-11 h-11 text-gray-600"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/>
                          <path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/>
                          <circle cx="13" cy="7" r="1" fill="currentColor"/>
                          <rect x="8" y="2" width="14" height="14" rx="2"/>
                        </svg>

                        <div className="flex flex-col items-start justify-center w-full">
                          <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-gray-600 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                            ID Photos will display here
                          </div>
                          <div className="w-full font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-gray-400 text-[length:var(--text-label-xsmall-regular-font-size)] text-center tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                            At least 1 photo is required
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

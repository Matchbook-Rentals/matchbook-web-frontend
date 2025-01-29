import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ApplicationItemHeaderStyles, ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';
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

interface IdentificationItem {
  idType: string;
  idNumber: string;
}

interface ApplicationBasicInfoProps {
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  setPersonalInfo: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
  }>>;
  ids: IdentificationItem;
  setIds: React.Dispatch<React.SetStateAction<IdentificationItem>>;
  verificationImages: VerificationImage[];
  setVerificationImages: React.Dispatch<React.SetStateAction<VerificationImage[]>>;
  application: any;
  toast: ReturnType<typeof useToast>['toast'];
}

const ID_TYPES = [
  { value: "driversLicense", label: "Driver\'s License" },
  { value: "passport", label: "Passport" }
];

export const ApplicationBasicInfo: React.FC<ApplicationBasicInfoProps> = ({
  personalInfo,
  setPersonalInfo,
  ids,
  setIds,
  verificationImages,
  setVerificationImages,
  application,
  toast
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIds(prev => ({ ...prev, idNumber: e.target.value }));
  };

  const handleIdTypeChange = (value: string) => {
    setIds(prev => ({ ...prev, idType: value }));
  };

  const handleUploadFinish = (res: UploadData[]) => {
    const newImages = res.map((upload) => ({ url: upload.url, category: 'Identification' as ImageCategory }));
    setVerificationImages(prev => [...prev, ...newImages]);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Function to check if the form has been changed
  const checkIsEditing = () => {
    const initialPersonalInfo = {
      firstName: application?.firstName || '',
      lastName: application?.lastName || ''
    };
    const initialIds = {
      idType: application?.identifications?.[0]?.idType || '',
      idNumber: application?.identifications?.[0]?.idNumber || ''
    };
    const initialImages = application?.verificationImages || [];

    const isPersonalInfoChanged = JSON.stringify(personalInfo) !== JSON.stringify(initialPersonalInfo);
    const isIdsChanged = JSON.stringify(ids) !== JSON.stringify(initialIds);
    const isImagesChanged = verificationImages.length !== initialImages.length;

    setIsEditing(isPersonalInfoChanged || isIdsChanged || isImagesChanged);
  };

  useEffect(() => {
    checkIsEditing();
  }, [personalInfo, ids]);

  useEffect(() => {
    if (isEditing) {
      toast({
        title: "Please Finish the Form",
        description: "You must complete the current form before navigating away.",
        variant: "destructive",
      });
    }
  }, [isEditing, toast]);

  return (
    <div className="space-y-4">
      <h2 className={ApplicationItemSubHeaderStyles}>
        Full Name
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className={ApplicationItemLabelStyles}>First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={personalInfo.firstName}
            onChange={handlePersonalInfoChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className={ApplicationItemLabelStyles}>Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={personalInfo.lastName}
            onChange={handlePersonalInfoChange}
          />
        </div>
      </div>
      <div className="mt-8">
        <h3 className={ApplicationItemSubHeaderStyles}>Identification</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="idType" className={ApplicationItemLabelStyles}>Id Type</Label>
            <Select
              value={ids?.idType}
              onValueChange={handleIdTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Id type" />
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
            <Label htmlFor="idNumber" className={ApplicationItemLabelStyles}>Id Number</Label>
            <Input
              id="idNumber"
              value={ids.idNumber}
              onChange={handleIdChange}
            />
          </div>
        </div>
        <div className="mt-2">
          <Label className={ApplicationItemLabelStyles}>Please upload a photo of your Id</Label>
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
            <Label className={ApplicationItemLabelStyles}>Id image uploads</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {verificationImages.map((img, idx) => (
                <Dialog key={idx} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                  <DialogTrigger asChild>
                    <img
                      src={img.url}
                      alt={`Id image ${idx + 1}`}
                      className="w-full h-auto cursor-pointer"
                      onClick={() => handleImageClick(idx)}
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Id Images</DialogTitle>
                      <DialogDescription>Use arrows to navigate between images</DialogDescription>
                    </DialogHeader>
                    <Carousel opts={{ loop: true, startIndex: selectedImageIndex ?? 0 }}>
                      <CarouselContent>
                        {verificationImages.map((image, index) => (
                          <CarouselItem key={index}>
                            <Card>
                              <CardContent className="flex aspect-square items-center justify-center p-6">
                                <img src={image.url} alt={`Id image ${index + 1}`} className="w-full h-auto" />
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
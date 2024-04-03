'use client';

import React, { useCallback } from "react";
import { CldUploadWidget } from 'next-cloudinary';
import Image from "next/image";
import { TbPhotoPlus } from 'react-icons/tb';
import { Button } from "@/components/ui/button";


declare global {
  var cloudinary: any;
}

interface InfoFormProps {
  propertyDetails: Object;
  setPropertyDetails: (details: Object) => void;
  onNext: () => void;
  onBack: () => void;
}


const ImageUploadForm: React.FC<InfoFormProps> = ({ propertyDetails, setPropertyDetails, onNext, onBack }) => {

  const handleUpload = useCallback((result: any) => {
    setPropertyDetails(prev => ({ ...prev, imageSrc: result.info.secure_url }))
  }, [setPropertyDetails]);

  return (
    <>
      <CldUploadWidget
        onUpload={handleUpload}
        uploadPreset="nx5qs1lt"
        options={{ maxFiles: 1 }}
      >
        {({ open }) => {
          return (
            <div onClick={() => open()} className="relative cursor-pointer hover:opacity-70 transition border-dashed border-2 p-20 border-neutral-300 flex flex-col justify-center items-center gap-4 text-neutral-600">
              <TbPhotoPlus size={50} />
              <div className="font-semibold text-lg">Click to upload</div>
              {propertyDetails.imageSrc && (
                <div className="absolute inset-0 w-full h-full">
                  <Image
                    alt='upload'
                    src={propertyDetails.imageSrc}
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          )
        }}
      </CldUploadWidget>
      <Button className="m-1" onClick={onBack}>Back</Button>
      <Button className="m-2" onClick={onNext}>Next</Button>
    </>
  )
}

export default ImageUploadForm;
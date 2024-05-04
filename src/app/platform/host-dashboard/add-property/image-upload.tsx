"use client";

import React, { useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { TbPhotoPlus } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { UploadButton, UploadDropzone } from "@/app/utils/uploadthing";

declare global {
  var cloudinary: any;
}

interface InfoFormProps {
  propertyDetails: Object;
  setPropertyDetails: (details: Object) => void;
  goToNext: () => void;
  goToPrevious: () => void;
}

const ImageUploadForm: React.FC<InfoFormProps> = ({
  propertyDetails,
  setPropertyDetails,
  goToNext,
  goToPrevious,
}) => {
  const [imageSrc, setImageSrc] = React.useState(null);
  const handleUpload = useCallback(
    (result: any) => {
      setPropertyDetails((prev) => ({
        ...prev,
        imageSrc: result.info.secure_url,
      }));
    },
    [setPropertyDetails],
  );

  return (
    <>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => setImageSrc(res[0].url)}
        className="p-0 mt-5 "
        appearance={{ button: 'bg-parent text-black border-black border-2 focus-within:ring-primaryBrand ut-ready:bg-red-500  data-[state="uploading"]:after:bg-primaryBrand' }}
      />

      {imageSrc && <img src={imageSrc} />}

      <UploadDropzone endpoint="imageUploader" />
      <Button className="m-1" onClick={goToPrevious}>
        Back
      </Button>
      <Button className="m-2" onClick={goToNext}>
        Next
      </Button>
    </>
  );
};

export default ImageUploadForm;

"use client";

import React, { useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { TbPhotoPlus } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/app/utils/uploadthing";

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
      <CldUploadWidget
        onUpload={handleUpload}
        uploadPreset="nx5qs1lt"
        options={{ maxFiles: 1 }}
      >
        {({ open }) => {
          return (
            <div
              onClick={() => open()}
              className="relative cursor-pointer hover:opacity-70 transition border-dashed border-2 p-20 border-neutral-300 flex flex-col justify-center items-center gap-4 text-neutral-600"
            >
              <TbPhotoPlus size={50} />
              <div className="font-semibold text-lg">Click to upload</div>
              {propertyDetails.imageSrc && (
                <div className="absolute inset-0 w-full h-full">
                  <Image
                    alt="upload"
                    src={propertyDetails.imageSrc}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
              )}
            </div>
          );
        }}
      </CldUploadWidget>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={() => alert("Done!")}
      />
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

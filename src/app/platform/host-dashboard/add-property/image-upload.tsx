"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import { TbPhotoPlus } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { UploadButton, UploadDropzone } from "@/app/utils/uploadthing";
import { ClientUploadedFileData } from "uploadthing/types";
import { ListingImage } from "@prisma/client";

interface InfoFormProps {
  propertyDetails: Object;
  setPropertyDetails: (details: Object) => void;
  goToNext: () => void;
  goToPrevious: () => void;
}

interface UploadData {
  name: string;             // Stores the file name
  size: number;             // Stores the file size
  key: string;              // Unique key for the file
  serverData: {             // Nested object for additional server-related data
    uploadedBy: string;   // Identifier of the user who uploaded the file
    fileUrl: string;      // URL where the file is accessible
  };
  url: string;              // Direct URL to access the file
  customId: string | null;  // Custom identifier for the file, nullable
  type: string;             // MIME type of the file
}

const ImageUploadForm: React.FC<InfoFormProps> = ({ propertyDetails, setPropertyDetails, goToNext, goToPrevious, }) => {

  const [imageSrc, setImageSrc] = React.useState('');
  const [listingImages, setListingImages] = React.useState<ListingImage[]>([]);


  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    let listingImage: ListingImage;
    const tempImageArray = res.map((upload) => ({ url: upload.url, id: upload.key }))
    setListingImages(prev => [...prev, ...tempImageArray])
  }

  return (
    <>
      <h2 className="text-center text-xl font-semibold mt-5">Add Photos</h2>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => handleUploadFinish(res)}
        className="p-0 mt-5 "
        appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand ut-ready:bg-red-500  data-[state="uploading"]:after:bg-primaryBrand' }}
      />
      <div className="grid grid-cols-5 gap-4 mt-5">
        {listingImages.map((img) => (
          <div key={img.id} className="relative w-full pb-[100%] cursor-grab active:cursor-grabbing border-2 border-black" >
            <Image src={img.url} alt={`Uploaded image ${img.id}`} layout="fill" objectFit="cover" />
          </div>
        ))}
      </div>

      <h3 className="text-left text-lg font-semibold mt-5">Categories</h3>
{/* DROP ZONES WITH TITLE BEDROOM ONE */}
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

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
    let listingImage: ListingImage;
    for (let upload of res) {
      listingImage = {url: upload.url, id: upload.key}
      setListingImages(prev => [...prev, listingImage])
    }
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

{listingImages.length > 0 && listingImages.map((img, idx) => (
  <p key={img.id}>URL - {img.url}, ID - {img.id}</p>
))}

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



let response = [
    {
        "name": "ViewSelector.png",
        "size": 1869,
        "key": "a24bc5bb-2ee7-464e-bb02-a6305da3d0a2-hipm10.png",
        "serverData": {
            "uploadedBy": "user_2c0LbFPaCf57fWzesmSpfC3Zg96",
            "fileUrl": "https://utfs.io/f/a24bc5bb-2ee7-464e-bb02-a6305da3d0a2-hipm10.png"
        },
        "url": "https://utfs.io/f/a24bc5bb-2ee7-464e-bb02-a6305da3d0a2-hipm10.png",
        "customId": null,
        "type": "image/png"
    }
]
"use client";

import React from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/app/utils/uploadthing";
import { ListingImage } from "@prisma/client";
import ImageGrouping from "./image-grouping";

interface InfoFormProps {
  propertyDetails: { roomCount: number };
  setPropertyDetails: (details: { roomCount: number }) => void;
  goToNext: () => void;
  goToPrevious: () => void;
}

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

const ImageUploadForm: React.FC<InfoFormProps> = ({ propertyDetails, setPropertyDetails, goToNext, goToPrevious }) => {
  const [listingImages, setListingImages] = React.useState<ListingImage[]>([]);
  const [dragging, setDragging] = React.useState('');

  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    const tempImageArray = res.map((upload) => ({ url: upload.url, id: upload.key, category: null }));
    setListingImages(prev => [...prev, ...tempImageArray]);
  }

  const handleDragStart = (img: ListingImage) => {
    setDragging(img.id);
  }

  const handleDrop = (category) => {
    const tempListingImages = listingImages.map(img => {
      if (img.id !== dragging) {
        return img;
      }

      img.category = category;
      return img;
    })
    setListingImages(tempListingImages);
    setDragging(null);
    console.log('listing images', tempListingImages)
    console.log('dragging', dragging);

  }



  return (
    <>
      <h2 className="text-center text-xl font-semibold mt-5">Add Photos</h2>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={handleUploadFinish}
        className="p-0 mt-5"
        appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand ut-ready:bg-red-500  data-[state="uploading"]:after:bg-primaryBrand' }}
      />

      <ImageGrouping listingImages={listingImages} onDragStart={handleDragStart} handleDrop={handleDrop} />

      {Array.from({ length: propertyDetails.roomCount }).map((_, idx) => (
        <ImageGrouping
          key={idx}
          listingImages={listingImages.filter(img => img.category === `Bedroom ${idx + 1}`)}
          onDragStart={handleDragStart}
          groupingCategory={`Bedroom ${idx + 1}`}
          handleDrop={handleDrop}
        />
      ))}

      <h3 className="text-left text-lg font-semibold mt-5">Categories</h3>
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

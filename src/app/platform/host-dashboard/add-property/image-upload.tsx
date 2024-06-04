"use client";

import React, { useEffect } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/app/utils/uploadthing";
import { ListingImage } from "@prisma/client";
import ImageDragDrop from "./(image-components)/image-drag-drop";
import { motion } from 'framer-motion';

interface InfoFormProps {
  propertyDetails: any; // Adjusted to any to include images
  setPropertyDetails: (details: any) => void;
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
  const [groupingCategories, setGroupingCategories] = React.useState<string[]>([]);

  useEffect(() => {
    const initialCategories = ['unassigned'];
    for (let i = 1; i <= propertyDetails.roomCount; i++) {
      initialCategories.push(`Bedroom ${i}`);
    }
    setGroupingCategories(initialCategories);
  }, [propertyDetails.roomCount]);

  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    const tempImageArray = res.map((upload, idx) => ({ url: upload.url, id: upload.key, category: groupingCategories[0], rank: idx }));
    setListingImages(prev => [...prev, ...tempImageArray]);
  }

  const handleNext = () => {
    setPropertyDetails({
      ...propertyDetails,
      listingImages
    });
    goToNext();
  };

  return (
    <>
      <h2 className="text-center text-xl font-semibold mt-5">Add Photos</h2>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={handleUploadFinish}
        className="p-0 mt-5"
        appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand data-[state="uploading"]:after:bg-primaryBrand' }}
      />
      <ImageDragDrop
        listingImages={listingImages}
        setListingImages={setListingImages}
        groupingCategories={groupingCategories}
        setGroupingCategories={setGroupingCategories}
      />

      <h3 className="text-left text-lg font-semibold mt-5">Categories</h3>
      <div className="flex gap-2 justify-center mt-5 p-1">
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={goToPrevious}>BACK</button>
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={handleNext}>NEXT</button>
      </div>
    </>
  );
};

export default ImageUploadForm;

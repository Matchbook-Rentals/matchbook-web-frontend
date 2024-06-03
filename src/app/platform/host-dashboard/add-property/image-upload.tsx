"use client";

import React, { useEffect } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/app/utils/uploadthing";
import { ListingImage } from "@prisma/client";
import ImageGrouping from "./image-grouping";
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
  const [dragging, setDragging] = React.useState<ListingImage | null>(null);
  const [over, setOver] = React.useState({ img: '', activeHalf: '' });
  const [groupingCategories, setGroupingCategories] = React.useState<string[]>([]);

  useEffect(() => {
    const initialCategories = ['unassigned'];
    for (let i = 1; i <= propertyDetails.roomCount; i++) {
      initialCategories.push(`Bedroom ${i}`);
    }
    setGroupingCategories(initialCategories);
  }, [propertyDetails.roomCount]);

  const defaultListingImage: ListingImage = {
    id: '',
    url: '',
    category: 'unassigned',
    rank: 0,
  };

  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    const tempImageArray = res.map((upload, idx) => ({ url: upload.url, id: upload.key, category: 'unassigned', rank: idx }));
    setListingImages(prev => [...prev, ...tempImageArray]);
  }

  const handleDragStart = (img: ListingImage) => {
    setDragging(img);
  }

  const removeImgFromOldCategory = (draggedImage: ListingImage) => {
    let removedDraggedArray = listingImages.filter(img => img.id !== draggedImage.id);
    console.log(removedDraggedArray);
    let oldCategoryArray = removedDraggedArray.filter(img => img.category === draggedImage.category);
    let restOfArray = listingImages.filter(img => img.category !== draggedImage.category);
    let sortedOldCategoryArray = oldCategoryArray.sort((a, b) => a.rank - b.rank);
    let updatedOldCategoryArray = sortedOldCategoryArray.map((img, idx) => {
      img.rank = idx + 1;
      return img;
    })
    let updatedArray = [...updatedOldCategoryArray, ...restOfArray]
    return updatedArray;
  }

  const insertToNewCategory = (arr: ListingImage[], newCategory: string, insertionRank: number) => {
    let newCategoryArray = arr.filter(img => img.category === newCategory);
    let restOfArray = arr.filter(img => img.category !== newCategory);
    let arrayWithSpaceAtRank = newCategoryArray.map((img: ListingImage, idx: number) => {
      if (img.rank >= insertionRank) {
        img.rank++
      }
      return img;
    })

    let tempImage = { ...dragging };
    tempImage.rank = insertionRank
    tempImage.category = newCategory;
    arrayWithSpaceAtRank.push(tempImage);

    let updatedArray = [...arrayWithSpaceAtRank, ...restOfArray];

    return updatedArray;

  }

  const handleDrop = (newCategory: string) => {
    if (!over.img) return;
    if (over.img.id === dragging.id && newCategory === dragging?.category) return;
    const overImage = over.img;
    const activeHalf = over.activeHalf;
    let insertionRank = overImage.rank;

    if (over.img.id === dragging.id && newCategory !== dragging?.category) {
      insertionRank = listingImages.filter(img => img.category === newCategory).length + 1;
    }
    if (!insertionRank) {
      insertionRank = 1;
    }
    if (activeHalf === 'right' && over.img.id !== dragging.id) {
      insertionRank++;
    }
    setOver({ img: '', activeHalf: '' });
    let removedFromOldCategory = removeImgFromOldCategory(dragging);
    let insertedAtNewCategory = insertToNewCategory(removedFromOldCategory, newCategory, insertionRank);

    setListingImages(insertedAtNewCategory);
    setDragging({ id: null, rank: null, category: null, url: null, listingId: null });
  };

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
      {/* <ImageGrouping listingImages={listingImages} onDragStart={handleDragStart} handleDrop={handleDrop} over={over} setOver={setOver} dragging={dragging} /> */}

      {groupingCategories.map((category, idx) => (
        <ImageGrouping
          key={category}
          listingImages={listingImages.filter(img => img?.category === category)}
          onDragStart={handleDragStart}
          groupingCategory={category}
          handleDrop={handleDrop}
          over={over}
          setOver={setOver}
          dragging={dragging}
        />
      ))}

      <h3 className="text-left text-lg font-semibold mt-5">Categories</h3>
      <div className="flex gap-2 justify-center mt-5 p-1">
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={goToPrevious}>BACK</button>
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={handleNext}>NEXT</button>
      </div>
    </>
  );
};

export default ImageUploadForm;

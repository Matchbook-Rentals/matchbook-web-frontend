"use client";

import React from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/app/utils/uploadthing";
import { ListingImage } from "@prisma/client";
import ImageGrouping from "./image-grouping";
import { motion } from 'framer-motion';

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
  const [dragging, setDragging] = React.useState<ListingImage | null>(null);
  // const [over, setOver] = React.useState('');
  const [over, setOver] = React.useState({ img: '', activeHalf: '' });

  const defaultListingImage: ListingImage = {
    id: '',
    url: '',
    category: 'unassigned',
    rank: 0,
    // Add default values for other properties if needed
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

  const insertToNewCategory = (arr: ListingImage, newCategory: string, insertionRank: number) => {
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
    // Condition occurs when ????
    if (!over.img) return;
    // Condition occurs when image is dropped onto itself
    if (over.img.id === dragging.id && newCategory === dragging?.category) return;
    const overImage = over.img;
    const activeHalf = over.activeHalf;
    let insertionRank = overImage.rank;

    // Condition occurs when dragged into new category without contacting another image
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



    // // Update category for the dragged image
    // const tempListingImages = listingImages.map(img => {
    //   if (img.id !== dragging.id) {
    //     return img;
    //   }

    //   img.category = newCategory
    //   return {
    //     ...img,
    //     category: newCategory
    //   };
    // });

    // console.log(tempListingImages)

    // // Assign ranks within the new category
    // const maxRank = tempListingImages.reduce((max, img) => (img.category === newCategory ? Math.max(max, img.rank || 0) : max), 0);

    // const updatedListingImages = tempListingImages.map(img => {
    //   if (img.id === dragging.id) {
    //     return {
    //       ...img,
    //       rank: maxRank + 1 // Increment the max rank found in the category
    //     };
    //   }
    //   return img;
    // });
    // setListingImages(updatedListingImages);
    // setDragging({ id: null, rank: null, category: null, url: null, listingId: null });

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
      <ImageGrouping listingImages={listingImages} onDragStart={handleDragStart} handleDrop={handleDrop} over={over} setOver={setOver} dragging={dragging} />

      {Array.from({ length: propertyDetails.roomCount }).map((_, idx) => (
        <ImageGrouping
          key={`Bedroom ${idx + 1}`}
          listingImages={listingImages.filter(img => img?.category === `Bedroom ${idx + 1}`)}
          onDragStart={handleDragStart}
          groupingCategory={`Bedroom ${idx + 1}`}
          handleDrop={handleDrop}
          over={over}
          setOver={setOver}
          dragging={dragging}
        />
      ))}


      <h3 className="text-left text-lg font-semibold mt-5">Categories</h3>
      <div className="flex gap-2 justify-center mt-5 p-1">
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={goToPrevious}>BACK</button>
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={goToNext}>NEXT</button>
      </div>
    </>
  );
};

export default ImageUploadForm;

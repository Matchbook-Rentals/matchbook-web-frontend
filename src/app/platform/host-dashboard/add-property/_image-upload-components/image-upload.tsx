"use client";

import React from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/app/utils/uploadthing";
import { ListingImage } from "@prisma/client";
import ImageGrouping from "./image-grouping";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

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

interface DragLocation {
  index: number;
  droppableId: string;
}

interface DragResult {
  draggableId: string;
  type: string;
  source: DragLocation;
  reason: string;
  mode: string;
  destination: DragLocation | null; // destination can be null if the draggable is dropped outside of a droppable area
  combine: null; // assuming combine is always null for the current setup; adjust if needed
}


const ImageUploadForm: React.FC<InfoFormProps> = ({ propertyDetails, setPropertyDetails, goToNext, goToPrevious }) => {
  const [listingImages, setListingImages] = React.useState<ListingImage[]>([]);
  const [dragging, setDragging] = React.useState('');

  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    const tempImageArray = res.map((upload, idx) => ({ url: upload.url, id: upload.key, category: 'upload-zone', rank: idx }));
    setListingImages(prev => [...prev, ...tempImageArray]);
  }

  const handleDragStart = (id: string) => {
    setDragging(id);
  }

  const handleDragEnd = (result: DragResult) => {
    const { source, destination } = result;

    if (!destination) return;  // Exit if no valid drop destination

    if (source.droppableId === destination.droppableId) {
      let imagesInSameCategory = listingImages.filter(img => img.category === source.droppableId);
      imagesInSameCategory.sort((a, b) => a.rank - b.rank);  // Ensure images are sorted by rank

      // Adjust ranks: increment ranks of images beyond the destination index
      const updatedImages = imagesInSameCategory.map(img => {
        if (img.id !== result.draggableId && img.rank >= destination.index) {
          return { ...img, rank: img.rank + 1 };
        }
        return img;
      });

      // Find and update the rank of the dragged image
      const draggedImageIndex = updatedImages.findIndex(img => img.id === result.draggableId);
      if (draggedImageIndex !== -1) {
        updatedImages[draggedImageIndex].rank = destination.index;
      }

      // Normalize ranks to ensure no gaps
      updatedImages.sort((a, b) => a.rank - b.rank);
      updatedImages.forEach((img, idx) => { img.rank = idx; });

      // Merge back into main images list
      const otherImages = listingImages.filter(img => img.category !== source.droppableId);
      const finalImages = [...otherImages, ...updatedImages];

      setListingImages(finalImages);
      console.log('Updated Images:', finalImages);
    }
  };

  a

  const handleDrop = (category) => {

    // Update category for the dragged image
    const tempListingImages = listingImages.map(img => {
      if (img.id !== dragging) {
        return img;
      }

      img.category = category
      return {
        ...img,
        category: category
      };
    });

    console.log(tempListingImages)

    // Assign ranks within the new category
    const maxRank = tempListingImages.reduce((max, img) => (img.category === category ? Math.max(max, img.rank || 0) : max), 0);

    const updatedListingImages = tempListingImages.map(img => {
      if (img.id === dragging) {
        return {
          ...img,
          rank: maxRank + 1 // Increment the max rank found in the category
        };
      }
      return img;
    });

    console.log(updatedListingImages)
    console.log(category)

    setListingImages(updatedListingImages);
    setDragging(null);

  };



  return (
    <>
      <h2 className="text-center text-xl font-semibold mt-5">Add Photos</h2>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={handleUploadFinish}
        className="p-0 mt-5"
        appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand ut-ready:bg-red-500  data-[state="uploading"]:after:bg-primaryBrand' }}
      />


      <button onClick={() => console.log(listingImages)}>LOG</button>
      <DragDropContext onDragEnd={handleDragEnd}>

        <Droppable droppableId="upload-zone" direction='horizontal'>
          {(provided, snapshot) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5 border-2 border-gray-500 min-h-32">
              {listingImages.filter(image => image.category === 'upload-zone').map((img, index) => (
                <Draggable key={img.id} draggableId={img.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        backgroundColor: snapshot.isDragging ? 'lightgreen' : 'grey',
                        ...provided.draggableProps.style
                      }}
                    >
                      <div className="relative w-full pb-[70%] border-2 border-black" >
                        <Image src={img.url} alt={`Uploaded image ${img.id}`} layout="fill" objectFit="cover" />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        {Array.from({ length: propertyDetails.roomCount }).map((item: any, idx) => (

          <Droppable key={`droppable-${idx}`} droppableId={`droppable-${idx}`}>
            {(provided, snapshot) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {item.content}
                    </div>
                  )}
                </Draggable>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
        {/* More Droppable components if needed */}
      </DragDropContext>


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

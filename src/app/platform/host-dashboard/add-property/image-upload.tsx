"use client";

import React from 'react';
import Image from "next/image";
import Container from './_image-upload-components/sortable-container'
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/app/utils/uploadthing";
import { ListingImage } from "@prisma/client";
import { DndContext, useSensor, PointerSensor, useSensors, KeyboardSensor, DragStartEvent, DragMoveEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import ImageGrouping from "./image-grouping";
import Items from './_image-upload-components/sortable-item';

interface InfoFormProps {
  propertyDetails: { roomCount: number };
  setPropertyDetails: (details: { roomCount: number }) => void;
  goToNext: () => void;
  goToPrevious: () => void;
}

interface Room {
  id: string;
  images: ListingImage[]; // Assuming ListingImage is imported from Prisma
  rank: number;
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
  const [containers, setContainers] = React.useState(() => initializeRooms(propertyDetails.roomCount));
  const [dragging, setDragging] = React.useState('');
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  )


  function initializeRooms(roomCount: number): Room[] {
  // Create an array of rooms based on the room count
  const rooms = Array.from({ length: roomCount }, (v, index) => ({
    id: `Room ${index + 1}`,
    images: [],
    rank: index + 1
  }));

  // Add specific rooms for "dropzone" and "kitchen"
  rooms.push({
    id: 'dropzone',
    images: [],
    rank: roomCount + 1
  });
  rooms.push({
    id: 'kitchen',
    images: [],
    rank: roomCount + 2
  });

  return rooms;
}

  const handleUploadFinish = (res: UploadData[]) => {
    console.log(res);
    const tempImageArray = res.map((upload) => ({ url: upload.url, id: upload.key, category: null }));
    setListingImages(prev => [...prev, ...tempImageArray]);
    const tempContainers = containers.map(container => {
      if (container.id !== 'dropzone') return container;
      container.images = [...tempImageArray]
      return container;
    })
    setContainers(tempContainers);
  }

  const handleDragStart = ( event: DragStartEvent) => {
    console.log('DRAG START')
  }

  const handleDragMove = (event: DragMoveEvent) => {
    console.log('Drag move');
  }

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(event);
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = listingImages.indexOf(active.id);
      const newindex = listingImages.indexOf(over.id);
      arrayMove(listingImages, oldIndex, newindex);
    }
  }

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
      <h2 onClick={() => console.log(containers)} className="text-center text-xl font-semibold mt-5">Add Photos</h2>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={handleUploadFinish}
        className="p-0 mt-5"
        appearance={{ button: 'bg-parent text-black border-black border-2 lg:w-2/5 md:3/5 sm:4/5 px-2 focus-within:ring-primaryBrand ut-ready:bg-red-500  data-[state="uploading"]:after:bg-primaryBrand' }}
      />
      <ImageGrouping listingImages={listingImages} onDragStart={handleDragStart} handleDrop={handleDrop} />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart} onDragMove={handleDragMove}>
        <SortableContext items={containers.map( (container, idx) => container.id)}>
          <div className='flex space-between bg-red-500'>


          {containers.map((container, idx) => (
            <Container 
            key={container.id}
            title={container.id}
            id={container.id}
            >
              <SortableContext items={container.images.map(img => img.id)}>
                {container.images.map((img, idx) => (
                  <Items key={img.id} url={img.url} id={img.id} />
                ))}

              </SortableContext>

            </Container>
          ))}
          </div>
        </SortableContext>

      </DndContext>

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

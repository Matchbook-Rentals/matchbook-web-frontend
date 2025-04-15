import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { NullableListingImage } from "./add-property-client";

interface ListingPhotoSelectionProps {
  listingPhotos: NullableListingImage[];
  selectedPhotos: NullableListingImage[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<NullableListingImage[]>>;
}

export const ListingPhotoSelection: React.FC<ListingPhotoSelectionProps> = ({
  listingPhotos,
  selectedPhotos,
  setSelectedPhotos,
}) => {
  // Track which featured photo is active for preview (default: first)
  const [activeIdx, setActiveIdx] = useState(0);

  // Handle selecting/deselecting from gallery
  const handleSelectPhoto = (photo: NullableListingImage) => {
    const idx = selectedPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) {
      // If already selected, remove and null its rank
      const removedPhoto = { ...selectedPhotos[idx], rank: null };
      const newSelected = selectedPhotos.filter((p) => p.id !== photo.id);
      // Re-rank remaining
      const reRanked = newSelected.map((p, i) => ({ ...p, rank: i + 1 }));
      setSelectedPhotos(reRanked);
      // If the removed photo was the active one, reset preview
      if (activeIdx >= reRanked.length) {
        setActiveIdx(0);
      }
    } else if (selectedPhotos.length < 4) {
      // Add photo with correct rank
      const newPhoto = { ...photo, rank: selectedPhotos.length + 1 };
      const newSelected = [...selectedPhotos, newPhoto];
      setSelectedPhotos(newSelected);
      // If first photo added, set as active
      if (selectedPhotos.length === 0) setActiveIdx(0);
    }
  };

  // Handle clicking a featured slot (preview or deselect)
  const handleSlotClick = (idx: number) => {
    if (selectedPhotos[idx]) {
      if (activeIdx === idx) {
        // Deselect if clicking active slot, null its rank
        const removedPhoto = { ...selectedPhotos[idx], rank: null };
        const newSelected = selectedPhotos.filter((_p, i) => i !== idx);
        // Re-rank remaining
        const reRanked = newSelected.map((p, i) => ({ ...p, rank: i + 1 }));
        setSelectedPhotos(reRanked);
        setActiveIdx(0);
      } else {
        setActiveIdx(idx);
      }
    }
  };

  // Large preview photo (active selected, or placeholder)
  const previewPhoto = selectedPhotos[activeIdx] || null;

  return (
    <section className="w-full max-w-[889px] mx-auto">
      <header className="mb-10">
        <h1 className="font-medium text-2xl text-[#3f3f3f] font-['Montserrat',Helvetica] mb-2">
          Select your featured photos
        </h1>
        <p className="font-normal text-2xl text-[#3f3f3f] font-['Montserrat',Helvetica]">
          These are the first photos guests see
        </p>
      </header>

      <div className="grid grid-cols-12 gap-4 mb-6">
        {/* Large preview box */}
        <div className="col-span-6 border border-dashed border-black h-full flex flex-col items-center justify-center overflow-hidden bg-gray-100 aspect-[16/9] max-h-[464px]">
          {previewPhoto ? (
            <img
              className="w-full h-full object-contain bg-gray-100"
              alt={previewPhoto.id || "Preview photo"}
              src={previewPhoto.url || ""}
            />
          ) : (
            <p className="font-normal text-2xl text-[#3f3f3f] font-['Montserrat',Helvetica] text-center">
              Select 4 photos below
            </p>
          )}
        </div>
        {/* 4 small featured slots */}
        <div className="col-span-6 grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`border border-dashed border-black flex items-center justify-center overflow-hidden bg-gray-100 cursor-pointer transition-all relative group aspect-[16/9] max-h-[232px] ${activeIdx === idx && selectedPhotos[idx] ? 'ring-2 ring-charcoalBrand' : ''}`}
              onClick={() => handleSlotClick(idx)}
              title={selectedPhotos[idx] ? (activeIdx === idx ? 'Click to remove' : 'Click to preview') : ''}
            >
              {selectedPhotos[idx] ? (
                <img
                  className="w-full h-full object-contain group-hover:opacity-80 transition bg-gray-100"
                  alt={selectedPhotos[idx].id || "Featured photo"}
                  src={selectedPhotos[idx].url || ""}
                  style={{ aspectRatio: '16/9' }}
                />
              ) : (
                <span className="text-gray-300 text-4xl">+</span>
              )}
              {/* Remove icon overlay if active */}
              {activeIdx === idx && selectedPhotos[idx] && (
                <span className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-xs font-bold text-charcoalBrand opacity-80">Remove</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Photo gallery for selection */}
      <div className="grid grid-cols-4 gap-8 mt-20 mb-5">
        {listingPhotos.map((photo) => {
          const isSelected = selectedPhotos.some((p) => p.id === photo.id);
          return (
            <Card
              key={photo.id}
              className={`p-0 overflow-hidden cursor-pointer border-2 transition-all bg-gray-100 ${isSelected ? "border-charcoalBrand" : "border-gray-200 hover:border-charcoalBrand"}`}
              onClick={() => handleSelectPhoto(photo)}
              title={isSelected ? "Click to remove from featured" : "Click to add as featured"}
            >
              <CardContent className="p-0">
                <img
                  className={`w-full h-full object-contain transition-opacity bg-gray-100 ${isSelected ? "opacity-60" : "opacity-100"}`}
                  alt={photo.id || "Photo"}
                  src={photo.url || ""}
                  style={{ aspectRatio: '16/9' }}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Validation message */}
      {selectedPhotos.length < 4 && (
        <div className="mt-4 text-red-600 font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
          Please select 4 featured photos.
        </div>
      )}
    </section>
  );
};

export default ListingPhotoSelection;

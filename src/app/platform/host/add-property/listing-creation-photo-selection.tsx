import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";
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

  // Handle clicking a featured slot (just preview)
  const handleSlotClick = (idx: number) => {
    if (selectedPhotos[idx]) {
      setActiveIdx(idx);
    }
  };

  // Handle making a photo the cover photo
  const handleMakeCover = (idx: number) => {
    if (selectedPhotos[idx] && idx !== 0) {
      const newSelected = [...selectedPhotos];
      const photoToPromote = newSelected[idx];
      // Move the photo to position 0 (cover photo)
      newSelected.splice(idx, 1);
      newSelected.unshift(photoToPromote);
      // Re-rank all photos
      const reRanked = newSelected.map((p, i) => ({ ...p, rank: i + 1 }));
      setSelectedPhotos(reRanked);
      setActiveIdx(0);
    }
  };

  // Handle removing a photo
  const handleRemovePhoto = (idx: number) => {
    if (selectedPhotos[idx]) {
      const removedPhoto = { ...selectedPhotos[idx], rank: null };
      const newSelected = selectedPhotos.filter((_p, i) => i !== idx);
      // Re-rank remaining
      const reRanked = newSelected.map((p, i) => ({ ...p, rank: i + 1 }));
      setSelectedPhotos(reRanked);
      // If the removed photo was the active one, reset preview
      if (activeIdx >= reRanked.length) {
        setActiveIdx(0);
      }
    }
  };

  // Large preview photo (active selected, or placeholder)
  const previewPhoto = selectedPhotos[activeIdx] || null;

  return (
    <section className="w-full max-w-[889px] mx-auto">

      <div className="flex flex-col md:flex-row items-start gap-5 w-full mb-6">
        {/* Cover Photo Card - larger but same aspect ratio */}
        <Card className="w-full md:w-auto md:flex-1 max-w-md mx-auto md:mx-0 aspect-[4/3] bg-[#f7f7f7] rounded-xl overflow-hidden border-0 cursor-pointer transition-all relative">
          <CardContent className="p-0 h-full relative">
            <div className="absolute top-2.5 left-2.5 z-10">
              <Badge className="bg-white text-[#373940] hover:bg-white rounded px-2 py-1">
                <span className="font-text-label-xsmall-semi-bold font-[number:var(--text-label-xsmall-semi-bold-font-weight)] text-[length:var(--text-label-xsmall-semi-bold-font-size)] tracking-[var(--text-label-xsmall-semi-bold-letter-spacing)] leading-[var(--text-label-xsmall-semi-bold-line-height)] [font-style:var(--text-label-xsmall-semi-bold-font-style)]">
                  Cover Photo
                </span>
              </Badge>
            </div>
            {previewPhoto ? (
              <img
                className="w-full h-full object-cover"
                alt={previewPhoto.id || "Preview photo"}
                src={previewPhoto.url || ""}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <PlusIcon className="w-6 h-6 text-[#5d606d]" />
                  <span className="font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-[#5d606d] text-[length:var(--text-label-xsmall-regular-font-size)] text-center tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                    Add
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Photos - 2x2 grid */}
        <div className="flex flex-col gap-5 w-full md:flex-1">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-5 w-full max-w-md mx-auto md:max-w-none md:mx-0">
            {[0, 1, 2, 3].map((idx) => (
              <Card
                key={idx}
                className={`aspect-[4/3] bg-[#f7f7f7] rounded-xl overflow-hidden border-0 cursor-pointer transition-all relative group ${activeIdx === idx && selectedPhotos[idx] ? 'ring-2 ring-charcoalBrand' : ''}`}
                onClick={() => handleSlotClick(idx)}
                title={selectedPhotos[idx] ? (activeIdx === idx ? 'Click to remove' : 'Click to preview') : ''}
              >
                <CardContent className="p-0 h-full flex items-center justify-center">
                  {selectedPhotos[idx] ? (
                    <img
                      className="w-full h-full object-cover"
                      alt={selectedPhotos[idx].id || "Featured photo"}
                      src={selectedPhotos[idx].url || ""}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <PlusIcon className="w-6 h-6 text-[#5d606d]" />
                      <span className="font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-[#5d606d] text-[length:var(--text-label-xsmall-regular-font-size)] text-center tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                        {idx === 3 ? 'Add More' : 'Add'}
                      </span>
                    </div>
                  )}
                  {/* Action buttons overlay - always visible on mobile, hover on desktop */}
                  {selectedPhotos[idx] && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {idx !== 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMakeCover(idx);
                          }}
                          className="bg-white rounded px-2 py-1 shadow text-xs font-bold text-charcoalBrand hover:bg-gray-50 transition-colors"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(idx);
                        }}
                        className="bg-white rounded px-2 py-1 shadow text-xs font-bold text-red-600 hover:bg-gray-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Photo gallery for selection */}
      <div className="grid grid-cols-4 gap-4 mt-20 mb-5">
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
    </section>
  );
};

export default ListingPhotoSelection;

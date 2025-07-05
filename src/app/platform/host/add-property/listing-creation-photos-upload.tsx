import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UploadButton } from "@/app/utils/uploadthing";
import { BrandButton } from "@/components/ui/brandButton";

import type { NullableListingImage } from "./add-property-client";

interface ListingPhotosProps {
  listingPhotos: NullableListingImage[];
  setListingPhotos: React.Dispatch<React.SetStateAction<NullableListingImage[]>>;
}

export const ListingPhotos = ({ listingPhotos, setListingPhotos }: ListingPhotosProps): JSX.Element => {
  // Data for the upload component
  const uploadData = {
    title: "Show us what your place looks like",
    subtitle: "Listings with high quality photos get the most bookings",
    mainText: "Click or drag and drop photos below",
    actionText: "Upload from your device",
  };

  return (
    <div className="w-full max-w-[884px]">
      <div className="flex flex-col gap-2">
        <Card className="mt-0 border-none">
          <CardContent className="p-0">
            <div className="inline-flex h-[534px] items-center gap-2 px-[286px] py-[34px] bg-[#f4f4f4] rounded-xl border-2 border-solid border-[#d9dadf] flex-col justify-center">
              <div className="inline-flex gap-[100px] flex-col items-center relative flex-[0_0_auto]">
                <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                  <div className="relative w-[260.19px] h-[142px]">
                    <img
                      src="/listing-upload/upload-photo.png"
                      alt="Upload photos"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="relative self-stretch font-text-xs-regular text-[#475467] text-center">
                    SVG, PNG, JPG or GIF (max. 800x400px)
                  </p>
                </div>
                <UploadButton
                  endpoint="listingUploadPhotos"
                  config={{
                    mode: "auto"
                  }}
                  appearance={{
                    button: "border border-primaryBrand bg-background text-primaryBrand hover:bg-primaryBrand hover:text-white transition-all duration-300 h-[40px] min-w-[160px] rounded-lg px-[14px] py-[10px] gap-1 font-['Poppins'] font-semibold text-sm leading-5 tracking-normal w-full disabled:opacity-50 disabled:cursor-not-allowed",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: ({ ready, isUploading }) => (
                      <div className="flex items-center justify-center gap-2">
                        {isUploading && (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        <span>{isUploading ? "Uploading..." : "Click to upload"}</span>
                      </div>
                    ),
                  }}
                  onClientUploadComplete={(res) => {
                    // Each item in res is a file upload result
                    // Adapt this if your response shape is different
                    if (Array.isArray(res)) {
                      const newPhotos: NullableListingImage[] = res.map((file, idx) => ({
                        id: file.key || null,
                        url: file.url || null,
                        listingId: null, // can be set later
                        category: null,
                        rank: null, // append to end
                      }));
                      setListingPhotos(prev => [...prev, ...newPhotos]);
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Thumbnails of uploaded photos */}
        {listingPhotos.length > 0 && (
          <>
            <div className="mt-4 flex flex-row gap-2 flex-wrap">
              {listingPhotos.map((photo, idx) => (
                photo.url ? (
                  <div key={photo.id || idx} className="w-20 h-20 rounded overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
                    <img
                      src={photo.url}
                      alt={`Listing photo ${idx + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : null
              ))}
            </div>
            {listingPhotos.length < 4 && (
              <div className="mt-2 text-red-600 font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                <span>
                  {listingPhotos.length === 0 
                    ? "You must upload at least 4 photos" 
                    : `You need to upload ${4 - listingPhotos.length} more photo${listingPhotos.length === 3 ? '' : 's'} (minimum 4 required)`}
                </span>
              </div>
            )}
            {listingPhotos.length >= 4 && (
              <div className="mt-2 text-green-600 font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {listingPhotos.length === 4 
                  ? "Great! You've met the minimum 4 photos requirement." 
                  : `Great! You've uploaded ${listingPhotos.length} photos (minimum 4 required).`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ListingPhotos;

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UploadDropzone } from "@/app/utils/uploadthing";

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
        <h2 className="font-medium text-2xl text-[#3f3f3f] font-['Poppins',Helvetica]">
          {uploadData.title}
        </h2>
        <p className="font-normal text-2xl text-[#3f3f3f] font-['Poppins',Helvetica]">
          {uploadData.subtitle}
        </p>
        <Card className="mt-4 border-none">
          <CardContent className="p-0">
            <UploadDropzone
              endpoint="listingUploadPhotos"
              className="w-full"
              appearance={{
                uploadIcon: "hidden", // Hide default upload icon
                button: "bg-charcoalBrand", // Hide default button, use our own styling
                label: "text-2xl font-medium text-black underline font-['Poppins',Helvetica] cursor-pointer",
                container: "w-full flex flex-col items-center justify-center h-[232px] border border-dashed border-black rounded-none",
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
                    rank: listingPhotos.length + idx, // append to end
                  }));
                  setListingPhotos(prev => [...prev, ...newPhotos]);
                }
              }}
            />
          </CardContent>
        </Card>
        {/* Thumbnails of uploaded photos */}
        {listingPhotos.length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default ListingPhotos;

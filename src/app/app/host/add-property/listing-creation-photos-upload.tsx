import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UploadButton } from "@/app/utils/uploadthing";
import { BrandButton } from "@/components/ui/brandButton";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

import type { NullableListingImage } from "./add-property-client";

interface ListingPhotosProps {
  listingPhotos: NullableListingImage[];
  setListingPhotos: React.Dispatch<React.SetStateAction<NullableListingImage[]>>;
}

export const ListingPhotos = ({ listingPhotos, setListingPhotos }: ListingPhotosProps): JSX.Element => {
  const { toast } = useToast();

  const deletePhoto = async (photoId: string | null, photoUrl: string) => {
    if (!photoId) return;
    
    // Remove from local state immediately
    setListingPhotos(prev => prev.filter(photo => photo.id !== photoId));
    
    // Send delete request to backend (fire and forget)
    try {
      await fetch('/api/delete-photo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId, photoUrl }),
      });
    } catch (error) {
      console.error('Failed to delete photo from backend:', error);
    }
  };
  
  // Data for the upload component
  const uploadData = {
    title: "Show us what your place looks like",
    subtitle: "Listings with high quality photos get the most bookings",
    mainText: "Click or drag and drop photos below",
    actionText: "Upload from your device",
  };

  // Focus styles for keyboard navigation only
  const focusStyles = `
    .uploadthing-focus {
      /* Target the specific label with data-ut-element="button" */
      & label[data-ut-element="button"] {
        /* Disable the default focus-within ring */
        &:focus-within {
          --tw-ring-color: transparent !important;
          --tw-ring-offset-width: 0px !important;
          --tw-ring-width: 0px !important;
        }
        
        /* Only show focus ring when child has focus-visible (keyboard nav) */
        &:has(input:focus-visible) {
          outline: 2px solid black !important;
          outline-offset: 4px !important;
          transition: none !important;
        }
      }
    }
  `;

  return (
    <div className="w-full">
      <style dangerouslySetInnerHTML={{ __html: focusStyles }} />
      <div className="flex flex-col gap-2">
        <Card className="mt-0 border-none">
          <CardContent className="p-0">
            <div className="flex min-h-[300px] md:min-h-[400px] lg:min-h-[534px] items-center gap-2 px-4 md:px-8 py-6 md:py-8 lg:py-[34px] bg-[#f4f4f4] rounded-xl border-2 border-solid border-[#d9dadf] flex-col justify-center w-full">
              <div className="flex gap-8 md:gap-16 lg:gap-[100px] flex-col items-center relative flex-[0_0_auto] max-w-full">
                <div className="flex gap-4 self-stretch w-full flex-col items-center relative flex-[0_0_auto]">
                  <div className="relative w-full max-w-[260px] h-[100px] md:h-[120px] lg:h-[142px]">
                    <img
                      src="/listing-upload/upload-photo.png"
                      alt="Upload photos"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="relative self-stretch font-text-xs-regular text-[#475467] text-center">
                    SVG, PNG, or JPG (max. 8MB)
                  </p>
                </div>
                <UploadButton
                  endpoint="listingUploadPhotos"
                  config={{
                    mode: "auto"
                  }}
                  className="uploadthing-focus uploadthing-custom"
                  appearance={{
                    button: "border border-primaryBrand bg-background text-primaryBrand hover:bg-primaryBrand hover:text-white transition-all duration-300 h-[40px] md:h-[44px] min-w-[160px] max-w-[280px] rounded-lg px-[14px] py-[10px] gap-1 font-['Poppins'] font-semibold text-sm md:text-base leading-5 tracking-normal w-full disabled:opacity-50 disabled:cursor-not-allowed",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: ({ ready, isUploading }) => (
                      <div className="flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-gray-500 focus-visible:outline-offset-2">
                        {isUploading && (
                          <Loader2 className="w-4 h-4 animate-spin" />
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
                      setListingPhotos(prev => Array.isArray(prev) ? [...prev, ...newPhotos] : newPhotos);
                    }
                  }}
                  onUploadError={(error) => {
                    console.error("Upload error:", error);
                    toast({
                      title: "Upload Error",
                      description: error.message || "Failed to upload photos. Please try again.",
                      variant: "destructive"
                    });
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Thumbnails of uploaded photos */}
        {(() => {
          const validPhotos = listingPhotos.filter(photo => photo.url);
          const validPhotoCount = validPhotos.length;
          
          return validPhotoCount > 0 && (
            <>
              <div className="mt-4 flex flex-row gap-2 flex-wrap">
                {validPhotos.map((photo, idx) => (
                  <div key={photo.id || idx} className="relative w-20 h-20 rounded overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center group">
                    <img
                      src={photo.url!}
                      alt={`Listing photo ${idx + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      onClick={() => deletePhoto(photo.id, photo.url!)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-black/30 hover:bg-black/80 text-white hover:text-red-500 rounded-full flex items-center justify-center z-10 shadow-md transition-colors duration-200"
                      aria-label="Delete photo"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-3 w-3" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default ListingPhotos;

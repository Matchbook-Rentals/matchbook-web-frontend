import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UploadDropzone } from "@/app/utils/uploadthing";

export const ListingPhotos = (): JSX.Element => {
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
              endpoint="imageUploader"
              className="w-full"
              appearance={{
                uploadIcon: "hidden", // Hide default upload icon
                button: "bg-charcoalBrand", // Hide default button, use our own styling
                label: "text-2xl font-medium text-black underline font-['Poppins',Helvetica] cursor-pointer",
                container: "w-full flex flex-col items-center justify-center h-[232px] border border-dashed border-black rounded-none",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListingPhotos;

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from 'next/image';

interface Identification {
  idType: string;
  idNumber: string;
}

interface VerificationImage {
  category: string;
  url: string;
}

interface ApplicationIdentityProps {
  identifications: Identification[];
  verificationImages: VerificationImage[];
}

const ApplicationIdentity: React.FC<ApplicationIdentityProps> = ({ identifications, verificationImages }) => {
  const identificationImages = verificationImages.filter(img => img.category === 'Identification');

  return (
    <>
      <h3 className="text-2xl text-center font-semibold mb-4">Identity Verification</h3>
      {identifications.length > 0 && (
        <Card className="mb-4">
          <CardContent className="flex justify-between items-center p-4">
            <div>
              <p className="font-semibold">ID Type: {identifications[0].idType === 'driversLicense' ? 'Driver\'s License' : 'Passport'}</p>
              <p>ID Number: {identifications[0].idNumber}</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Click to View</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px] xl:max-w-[1000px]">
                <DialogHeader>
                  <DialogTitle className='text-center'>ID Verification Images</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center">
                  <Carousel className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                    <CarouselContent>
                      {identificationImages.map((img, index) => (
                        <CarouselItem key={index}>
                          <div className="p-1">
                            <Image
                              src={img.url}
                              alt={`ID ${index + 1}`}
                              width={1200}
                              height={800}
                              className="w-full h-auto max-h-[80vh] object-contain"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ApplicationIdentity;
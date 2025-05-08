"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { isImageFile, formatFileSize } from '@/lib/utils';
import { Download as DownloadIcon, FileText as FileTextIcon, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export interface AttachmentFileItem {
  url: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  fileSize?: number;
}

interface AttachmentCarouselDialogProps {
  attachments: AttachmentFileItem[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialIndex?: number;
}

export const AttachmentCarouselDialog: React.FC<AttachmentCarouselDialogProps> = ({
  attachments,
  isOpen,
  onOpenChange,
  initialIndex = 0,
}) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentCarouselSlide, setCurrentCarouselSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    // Set initial slide number correctly when dialog opens or attachments change
    const currentIdx = carouselApi.selectedScrollSnap();
    setCurrentCarouselSlide(currentIdx >= 0 ? currentIdx + 1 : initialIndex + 1);

    const handleSelect = () => {
      if (carouselApi) { // Check if carouselApi is still defined
        setCurrentCarouselSlide(carouselApi.selectedScrollSnap() + 1);
      }
    };
    
    carouselApi.on("select", handleSelect);
    
    // Re-initialize if initialIndex changes while open
    if (isOpen && carouselApi.selectedScrollSnap() !== initialIndex) {
      carouselApi.scrollTo(initialIndex, true); // true for instant scroll
      setCurrentCarouselSlide(initialIndex + 1);
    }

    return () => {
      if (carouselApi) { // Check before calling off
        carouselApi.off("select", handleSelect);
      }
    };
  }, [carouselApi, initialIndex, isOpen]);
  
  // Effect to reset current slide when attachments change or dialog re-opens
  useEffect(() => {
     if (isOpen && attachments.length > 0) {
         const newSlideIndex = Math.max(0, Math.min(initialIndex, attachments.length - 1));
         setCurrentCarouselSlide(newSlideIndex + 1);
         if (carouselApi) {
             carouselApi.scrollTo(newSlideIndex, true); // true for instant scroll
         }
     }
  }, [isOpen, attachments, initialIndex, carouselApi]);


  const handleDownload = (file: AttachmentFileItem) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.setAttribute('download', file.fileName || 'download');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      link.remove();
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[90vw] h-[85vh] p-0 flex flex-col bg-card sm:rounded-lg test"> {/* Added test (red border) */}
        <DialogHeader className="p-4 border-b flex-shrink-0 border-pink-500"> {/* Added border-pink-500 for DialogHeader */}
          <DialogTitle className='text-center'>
            Attachments
            {attachments.length > 0 && ` (${currentCarouselSlide} of ${attachments.length})`}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-3.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <Carousel
          setApi={setCarouselApi}
          opts={{
            startIndex: initialIndex,
            loop: attachments.length > 1,
            align: "center",
          }}
          // Removed justify-center items-center from here for Solution 2
          className="flex-grow flex flex-col p-1 sm:p-4 min-h-0 overflow-hidden test-blue" // Added test-blue
        >
          <CarouselContent className="-ml-4  h-80 test-green"> {/* Added test-green */}
            {attachments.map((attachment, idx) => (
              <CarouselItem 
                key={attachment.fileKey || attachment.url || idx} 
                className="pl-4 basis-full h-full flex flex-col items-center justify-center test-yellow" // Added test-yellow
              >
                <div className="w-full h-full test relative flex items-center justify-center p-2 border-2 border-purple-500"> {/* Added border-purple-500 for image container */}
                  {isImageFile(attachment.fileName || '') ? (
                    <Image
                      src={attachment.url}
                      alt={attachment.fileName || 'Attachment'}
                      layout="fill"
                      objectFit="contain" // Changed from cover to contain in previous step
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg text-center h-auto w-auto max-w-md">
                      <FileTextIcon className="w-20 h-20 sm:w-24 sm:h-24 text-muted-foreground mb-4" />
                      <p className="text-base sm:text-lg font-semibold truncate max-w-xs sm:max-w-sm" title={attachment.fileName}>
                        {attachment.fileName || 'File'}
                      </p>
                      {attachment.fileSize && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        className="mt-4 sm:mt-6"
                        onClick={() => handleDownload(attachment)}
                      >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {attachments.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10" />
              <CarouselNext className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10" />
            </>
          )}
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};

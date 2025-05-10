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
  withDownloadButton?: boolean;
}

export const AttachmentCarouselDialog: React.FC<AttachmentCarouselDialogProps> = ({
  attachments,
  isOpen,
  onOpenChange,
  initialIndex = 0,
  withDownloadButton = false,
}) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Effect to handle carousel API initialization and event subscription
  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      const selectedIndex = carouselApi.selectedScrollSnap();
      setCurrentIndex(selectedIndex);
    };

    carouselApi.on("select", handleSelect);

    // Initialize carousel to the correct index
    if (isOpen) {
      const targetIndex = Math.min(Math.max(0, initialIndex), attachments.length - 1);
      carouselApi.scrollTo(targetIndex, true);
      setCurrentIndex(targetIndex);
    }

    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi, initialIndex, isOpen, attachments.length]);

  // Effect to handle keyboard navigation
  useEffect(() => {
    if (!isOpen || !carouselApi) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        carouselApi.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        carouselApi.scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [carouselApi, isOpen]);

  // Handle file download
  const handleDownload = async (file: AttachmentFileItem) => {
    if (file.url) {
      try {
        // Fetch the image/file as a blob
        const response = await fetch(file.url);
        const blob = await response.blob();
        
        // Create a blob URL and use it for download
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.fileName || 'download';
        
        // Append to body, click, and clean up
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Release the blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (error) {
        console.error('Error downloading file:', error);
        // Fallback to direct download if fetch fails
        const link = document.createElement('a');
        link.href = file.url;
        link.setAttribute('download', file.fileName || 'download');
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 flex flex-col bg-card sm:rounded-lg overflow-hidden" hideCloseButton>
        <DialogHeader className="p-4 border-b flex-shrink-0 relative">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
            <DialogTitle className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              {attachments.length > 1 
                ? `Attachment ${currentIndex + 1} of ${attachments.length}` 
                : "Attachment"}
            </DialogTitle>
            <div className="w-6 h-6"></div> {/* Spacer that matches X button dimensions */}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex items-center justify-center">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              startIndex: initialIndex,
              loop: attachments.length > 1,
              align: "center",
            }}
            className="w-full h-full"
          >
            <CarouselContent className="h-full">
              {attachments.map((attachment, idx) => (
                <CarouselItem 
                  key={attachment.fileKey || attachment.url || idx} 
                  className="flex items-center justify-center h-[70vh]"
                >
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {isImageFile(attachment.fileName || '') ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={attachment.url}
                          alt={attachment.fileName || 'Image attachment'}
                          fill
                          sizes="(max-width: 768px) 100vw, 80vw"
                          style={{ objectFit: 'contain' }}
                          priority
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg">
                        <FileTextIcon className="w-20 h-20 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold truncate max-w-xs md:max-w-md" title={attachment.fileName}>
                          {attachment.fileName || 'File'}
                        </p>
                        {attachment.fileSize && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatFileSize(attachment.fileSize)}
                          </p>
                        )}
                        <Button
                          className="mt-6"
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
                <CarouselPrevious className="absolute left-2 sm:left-4 bg-background/80 hover:bg-background" />
                <CarouselNext className="absolute right-2 sm:right-4 bg-background/80 hover:bg-background" />
              </>
            )}
          </Carousel>
        </div>

        {/* Download button for images (only shown if withDownloadButton is true) */}
        {withDownloadButton && attachments[currentIndex] && isImageFile(attachments[currentIndex].fileName || '') && (
          <div className="p-4 border-t flex justify-center">
            <Button 
              size="sm"
              onClick={() => handleDownload(attachments[currentIndex])}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

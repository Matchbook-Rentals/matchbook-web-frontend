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

  // Handle file download
  const handleDownload = (file: AttachmentFileItem) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.setAttribute('download', file.fileName || 'download');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 flex flex-col bg-card sm:rounded-lg overflow-hidden">
        <DialogHeader className="p-4 border-b flex-shrink-0 relative">
          <DialogClose className="absolute left-4 top-4 z-10">
            <X className="h-5 w-5" />
          </DialogClose>
          <DialogTitle className="text-center">
            {attachments.length > 1 
              ? `Attachment ${currentIndex + 1} of ${attachments.length}` 
              : "Attachment"}
          </DialogTitle>
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
                          variant="outline"
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

        {/* Download button for images */}
        {attachments[currentIndex] && isImageFile(attachments[currentIndex].fileName || '') && (
          <div className="p-4 border-t flex justify-center">
            <Button 
              variant="outline"
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
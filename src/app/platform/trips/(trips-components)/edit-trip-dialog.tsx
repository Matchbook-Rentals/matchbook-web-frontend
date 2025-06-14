'use client';

import { Trip } from '@prisma/client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Pencil } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import SearchEditBar from '@/components/home-components/search-edit-bar';

interface EditTripDialogProps {
  trip: Trip;
}

const EditTripDialog: React.FC<EditTripDialogProps> = ({ trip }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // Check screen size on mount and when window resizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
    };

    // Set initial value
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <BrandButton
          variant="outline"
          className="h-9"
          leftIcon={<Pencil className="h-4 w-4" />}
        >
          Edit
        </BrandButton>
      </DialogTrigger>

      {isMobile ? (
        // Mobile dialog
        <DialogContent
          className={cn(
            "min-w-[50vw] max-w-[80vw] sm:max-w-[60vw] bg-transparent border-none rounded-none  p-0 ",
            "h-fit max-h-[89dvh]"
          )}
        >
          <ScrollArea className="h-full max-h-[89dvh] rounded-[15px]">
            <SearchEditBar trip={trip} onClose={() => setOpen(false)} />
          </ScrollArea>
        </DialogContent>
      ) : (
        // Desktop dialog
        <DialogContent
          className={cn(
            "min-w-[50vw] max-w-[80vw] bg-background border py-2 x-2 lg:px-8 xl:max-w-4xl",
            "md:top-[25vh] h-[200px] overflow-y-visible"
          )}
        >
          <div className="mb-6 md:p-0">
            <h2 className="text-2xl font-semibold text-center">Edit Trip Details</h2>
          </div>
            <SearchEditBar trip={trip} onClose={() => setOpen(false)} />
        </DialogContent>
      )}
    </Dialog>
  );
};

export default EditTripDialog;

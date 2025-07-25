"use client";

import { XIcon } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "./brandDialog";

interface OnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueToSite: () => void;
  onListProperty: () => void;
}

export const OnboardingPopup: React.FC<OnboardingPopupProps> = ({
  isOpen,
  onClose,
  onContinueToSite,
  onListProperty,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="flex flex-col items-center gap-0 p-0 bg-white w-[95vw] max-w-[609px] mx-auto border-0 shadow-lg !top-[20%] translate-y-[-50%]"
        showCloseButton={false}
      >
        <Card className="w-full rounded-[20px] overflow-hidden border-0 shadow-none">

          <CardContent className="py-6 px-4 space-y-2">
            <h2 className="font-['Poppins',Helvetica] font-semibold text-[#484a54] text-2xl">
              We Are Now Onboarding Hosts!
            </h2>
            <p className="font-['Poppins',Helvetica] text-neutralneutral-700 text-sm">
              List now to receive priority ranking for your property. Renter Launch
              coming this September
            </p>
          </CardContent>

          <CardFooter className="p-4 pt-0 flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-lg border-[#3c8787] text-[#3c8787] font-['Poppins',Helvetica] font-semibold text-sm"
              onClick={onContinueToSite}
            >
              Continue To Site
            </Button>
            <Button 
              className="flex-1 bg-[#3c8787] hover:bg-[#2e6767] text-white font-['Poppins',Helvetica] font-semibold text-sm"
              onClick={onListProperty}
            >
              List Your Property
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

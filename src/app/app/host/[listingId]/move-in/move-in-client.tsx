"use client";

import React, { useState, useTransition, useEffect } from "react";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Listing } from "@prisma/client";
import { updateListingMoveInData } from "@/app/actions/listings";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface MoveInProps {
  listing: Listing;
}

export const MoveIn = ({ listing }: MoveInProps): JSX.Element => {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // Store original data from DB for comparison
  const [originalData, setOriginalData] = useState({
    moveInPropertyAccess: listing.moveInPropertyAccess || "",
    moveInParkingInfo: listing.moveInParkingInfo || "",
    moveInWifiInfo: listing.moveInWifiInfo || "",
    moveInOtherNotes: listing.moveInOtherNotes || "",
  });
  
  const [formData, setFormData] = useState({
    moveInPropertyAccess: listing.moveInPropertyAccess || "",
    moveInParkingInfo: listing.moveInParkingInfo || "",
    moveInWifiInfo: listing.moveInWifiInfo || "",
    moveInOtherNotes: listing.moveInOtherNotes || "",
  });
  
  // Check if form data has changed from original
  const hasChanges = Object.keys(formData).some(
    key => formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const result = await updateListingMoveInData(listing.id, formData);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Move-in instructions updated.",
      });
      
      // Update original data to match current form data
      setOriginalData({ ...formData });
      
      // Refresh the router to ensure data consistency
      router.refresh();
    } catch (error) {
      console.error("Error updating move-in instructions:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save move-in instructions",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Form fields data
  const formFields = [
    {
      key: "moveInPropertyAccess",
      label: "Property access",
      required: true,
      placeholder: "How renters gain entry into the property?",
    },
    {
      key: "moveInParkingInfo",
      label: "Parking",
      required: true,
      placeholder: "Where do renters park?",
    },
    {
      key: "moveInWifiInfo",
      label: "Wifi",
      required: true,
      placeholder: "If Wifi is provided how do renters get access?",
    },
    {
      key: "moveInOtherNotes",
      label: "Other notes",
      required: true,
      placeholder: "What other items should renters know?",
    },
  ];

  return (
    <div className="flex flex-col items-start gap-6">
      {/* Page title */}
      <div className="flex items-end gap-6 w-full">
        <div className="flex flex-col items-start gap-2 flex-1">
          <h1 className="text-2xl font-medium text-[#020202] [font-family:'Poppins',Helvetica]">
            Move-in Instructions
          </h1>
          <p className="text-sm font-normal text-[#5d606d] [font-family:'Poppins',Helvetica]">
            Renters will see these the day before move-in
          </p>
        </div>
      </div>

      {/* Form section */}
      <form onSubmit={handleSubmit} className="flex flex-col items-start gap-[18px] w-full">
        <Card className="w-full bg-white">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-5 w-full">
              <h2 className="text-xl font-medium text-gray-800 [font-family:'Poppins',Helvetica]">
                What should renters know at move-in
              </h2>

              {formFields.map((field, index) => (
                <div
                  key={`form-field-${index}`}
                  className="flex flex-col items-start gap-1.5 w-full"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <label className="font-medium text-[#344054] text-base [font-family:'Poppins',Helvetica]">
                      {field.label}
                    </label>
                  </div>
                  <Textarea
                    className="min-h-12 bg-sidebar"
                    placeholder={field.placeholder}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
          <div className="flex justify-center pb-6">
            <BrandButton 
              type="submit"
              disabled={isSubmitting || !hasChanges}
              spinOnClick={false}
              leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </BrandButton>
          </div>
        </Card>
      </form>
    </div>
  );
};

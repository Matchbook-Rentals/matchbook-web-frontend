"use client"

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  // Form field data moved inside the component
  const categories = [
    { value: "general", label: "General" },
    { value: "technical", label: "Technical" },
    { value: "billing", label: "Billing" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = () => {
    // TODO: Implement actual form submission logic here
    console.log("Form submitted (placeholder)");
    onOpenChange(false); // Close dialog on submit for now
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Adjusted max-width slightly to better fit the new content */}
      <DialogContent xOnRight className="sm:max-w-lg bg-[#fcfcfc]">
        {/* Using DialogHeader for title consistency, but applying new styles */}
        <DialogHeader className="items-center pb-4">
          <DialogTitle className="text-[28px] font-semibold text-[#212121] leading-8 font-['Poppins',Helvetica]">
            Submit Your Request
          </DialogTitle>
          {/* Removed DialogDescription */}
        </DialogHeader>

        {/* Form elements directly inside DialogContent */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="subject"
                className="font-medium text-[13px] text-[#212121] leading-4 font-['Poppins',Helvetica]"
              >
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="Enter the subject of your request"
                className="bg-[#51515117] border-transparent text-[15px] font-normal text-[#212121bf] leading-5 font-['Poppins',Helvetica] py-2"
              />
            </div>
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="description"
                className="font-medium text-[13px] text-[#212121] leading-4 font-['Outfit',Helvetica]"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description"
                className="min-h-[76px] bg-[#51515117] border-transparent text-[15px] font-normal text-[#272727bf] leading-5 font-['Poppins',Helvetica] py-2"
              />
            </div>
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="category"
                className="font-medium text-[13px] text-[#212121] leading-4 font-['Poppins',Helvetica]"
              >
                Category
              </Label>
              <Select>
                <SelectTrigger
                  id="category"
                  className="bg-[#51515117] border-transparent text-[15px] font-normal text-[#212121bf] leading-5 font-['Outfit',Helvetica] py-2"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="w-full py-2">
            <Button
              onClick={handleSubmit}
              className="w-full bg-[#5c9ac5] hover:bg-[#5c9ac5]/90 text-white font-medium text-[15px] leading-5 font-['Poppins',Helvetica]"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

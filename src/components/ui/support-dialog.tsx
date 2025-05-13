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
  // Style variables for consistent text styling
  const styles = {
    // Font family is consistent across all elements
    fontFamily: "font-['Poppins',Helvetica]",
    // Label styles
    label: "font-medium text-[13px] text-[#212121] leading-4",
    // Input/textarea/select field styles (with darker text for active input)
    field: "bg-[#51515117] border-transparent text-[15px] font-normal text-[#212121] leading-5 py-2",
    // Title style
    title: "text-[28px] font-semibold text-[#212121] leading-8",
    // Button style
    button: "w-full bg-[#5c9ac5] hover:bg-[#5c9ac5]/90 text-white font-medium text-[15px] leading-5",
    // Placeholder style for all components (including SelectValue)
    placeholderText: "text-[#212121bf] opacity-70 font-normal",
    // Placeholder style using Tailwind's placeholder: modifier (for Input and Textarea)
    placeholderTailwind: "placeholder:text-[#212121bf] placeholder:opacity-70 placeholder:font-normal placeholder:font-['Poppins',Helvetica]",
  };

  // Form field data with placeholders
  const formFields = [
    { id: "subject", label: "Subject", placeholder: "Enter the subject of your request", type: "input" },
    { id: "description", label: "Description", placeholder: "Provide a detailed description", type: "textarea" },
    { id: "category", label: "Category", placeholder: "Select a category", type: "select" },
  ];

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
      <DialogContent className="sm:max-w-lg bg-[#fcfcfc]">
        <DialogHeader className="items-center pb-4">
          <DialogTitle className={`${styles.title} ${styles.fontFamily}`}>
            Submit Your Request
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {formFields.map((field) => (
            <div key={field.id} className="w-full">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={field.id}
                  className={`${styles.label} ${styles.fontFamily}`}
                >
                  {field.label}
                </Label>
                
                {field.type === "input" && (
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    className={`${styles.field} ${styles.fontFamily} ${styles.placeholderTailwind}`}
                  />
                )}
                
                {field.type === "textarea" && (
                  <Textarea
                    id={field.id}
                    placeholder={field.placeholder}
                    className={`min-h-[76px] ${styles.field} ${styles.fontFamily} ${styles.placeholderTailwind}`}
                  />
                )}
                
                {field.type === "select" && (
                  <Select>
                    <SelectTrigger
                      id={field.id}
                      className={`${styles.field} ${styles.fontFamily}`}
                    >
                      <SelectValue 
                        placeholder={field.placeholder} 
                        className={`${styles.fontFamily} ${styles.placeholderText}`}
                      />
                    </SelectTrigger>
                    <SelectContent className={styles.fontFamily}>
                      {categories.map((category) => (
                        <SelectItem 
                          key={category.value} 
                          value={category.value}
                          className={`${styles.fontFamily} text-[#212121]`}
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}

          <div className="w-full py-2">
            <Button
              onClick={handleSubmit}
              className={`${styles.button} ${styles.fontFamily}`}
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

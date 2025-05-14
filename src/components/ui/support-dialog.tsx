"use client"

import React, { useState } from "react";
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
import { createTicket } from "@/app/actions/tickets";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const { user } = useUser();
  // Style variables for consistent text styling with improved design
  const styles = {
    // Font family is consistent across all elements
    fontFamily: "font-['Poppins',Helvetica]",
    // Label styles - improved contrast and weight
    label: "font-medium text-[14px] text-[#333333] leading-5 mb-1.5",
    // Input/textarea/select field styles - better contrast with borders
    field: "bg-[#F5F5F5] border border-[#CCCCCC] rounded-md text-[15px] font-normal text-[#333333] leading-5 py-3 px-4 focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] transition-all duration-200",
    // Title style - larger, bolder for better hierarchy
    title: "text-[22px] font-bold text-[#333333] leading-7",
    // Button style - more vibrant with hover effects
    button: "w-full bg-blueBrand hover:bg-blueBrand/80 text-white font-semibold text-[16px] leading-5 py-3 rounded-md transition-colors duration-300",
    // Placeholder style for SelectValue
    placeholderText: "text-[#555555] font-normal",
    // Placeholder style using Tailwind's placeholder: modifier (for Input and Textarea)
    placeholderTailwind: "placeholder:text-[#555555] placeholder:font-normal",
    // Content container with improved spacing
    container: "p-5 space-y-5",
    // Form group with better spacing
    formGroup: "w-full space-y-1.5",
  };

  // Form field data with placeholders
  const formFields = [
    { id: "category", label: "Category", placeholder: "Select a category", type: "select" },
    { id: "subject", label: "Subject", placeholder: "Enter the subject of your request", type: "input" },
    { id: "description", label: "Description", placeholder: "Provide a detailed description", type: "textarea" },
  ];

  const categories = [
    { value: "general", label: "General" },
    { value: "technical", label: "Technical" },
    { value: "billing", label: "Billing" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async () => {
    try {
      // Validate form fields
      if (!subject.trim()) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please enter a subject for your request."
        });
        return;
      }

      if (!description.trim()) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please provide details about your request."
        });
        return;
      }

      // Get user email - use user email if logged in, otherwise empty (will be caught by server validation)
      const email = user?.primaryEmailAddress?.emailAddress || "";
      const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";
      
      if (!email && !user) {
        toast({
          variant: "destructive",
          title: "Sign in Required",
          description: "Please sign in to submit a support request."
        });
        return;
      }
      
      // Prepare ticket data
      const ticketData = {
        title: subject,
        description: description,
        email: email,
        name: name,
        category: category || "general",
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      };

      setIsSubmitting(true);
      
      // Submit the ticket
      const result = await createTicket(ticketData);
      
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: "We couldn't send your request. Please try again later."
        });
      } else {
        toast({
          variant: "default",
          title: "Request Submitted",
          description: "We've received your request and will get back to you soon."
        });
        
        // Reset form and close dialog
        setCategory("");
        setSubject("");
        setDescription("");
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We couldn't send your request. Please try again later."
      });
      console.error("Error submitting support request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] bg-white rounded-lg shadow-lg">
        <DialogHeader className="items-center pb-4 border-b border-gray-100">
          <DialogTitle className={`${styles.title} ${styles.fontFamily}`}>
            Submit Your Request
          </DialogTitle>
        </DialogHeader>

        <div className={`${styles.container} flex flex-col items-center`}>
          {formFields.map((field) => (
            <div key={field.id} className={styles.formGroup}>
              <Label
                htmlFor={field.id}
                className={`${styles.label} ${styles.fontFamily} flex items-center`}
              >
                {field.label}
              </Label>
              
              {field.type === "input" && (
                <Input
                  id={field.id}
                  placeholder={field.placeholder}
                  required={field.id !== "category"}
                  className={`${styles.field} ${styles.fontFamily} ${styles.placeholderTailwind}`}
                  value={field.id === "subject" ? subject : ""}
                  onChange={(e) => field.id === "subject" && setSubject(e.target.value)}
                />
              )}
              
              {field.type === "textarea" && (
                <Textarea
                  id={field.id}
                  placeholder={field.placeholder}
                  required={field.id !== "category"}
                  className={`min-h-[120px] ${styles.field} ${styles.fontFamily} ${styles.placeholderTailwind}`}
                  value={field.id === "description" ? description : ""}
                  onChange={(e) => field.id === "description" && setDescription(e.target.value)}
                />
              )}
              
              {field.type === "select" && (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    id={field.id}
                    className={`${styles.field} ${styles.fontFamily}`}
                  >
                    <SelectValue 
                      placeholder={field.placeholder} 
                      className={`${styles.fontFamily} ${styles.placeholderText}`}
                    />
                  </SelectTrigger>
                  <SelectContent 
                    className={`${styles.fontFamily} bg-white border border-[#CCCCCC] rounded-md shadow-md`}
                  >
                    {categories.map((categoryOption) => (
                      <SelectItem 
                        key={categoryOption.value} 
                        value={categoryOption.value}
                        className={`${styles.fontFamily} text-[#333333] py-2 px-3 hover:bg-[#F5F5F5] cursor-pointer`}
                      >
                        {categoryOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}

          <div className="w-full mt-6">
            <Button
              onClick={handleSubmit}
              className={`${styles.button} ${styles.fontFamily}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"} 
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

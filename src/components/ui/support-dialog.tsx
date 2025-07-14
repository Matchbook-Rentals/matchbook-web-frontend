"use client"

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/brandDialog";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
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
      <DialogContent className="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-w-[900px] max-h-[90vh] p-4 sm:p-6 rounded-xl top-[5vh] sm:top-[10vh] md:top-[15vh] lg:top-[25vh] translate-y-0">
        <div className="flex items-center justify-between px-0 pb-0">
          <div className="w-6 h-6 opacity-0"></div>
          <h2 className="font-medium text-xl text-gray-neutral900">
            Submit your Request
          </h2>
          <div className="w-6 h-6 opacity-0"></div>
        </div>

        <div className="flex flex-col items-end gap-6 w-full mt-6">
          <div className="flex flex-col items-start gap-4 w-full">
            <div className="flex items-center gap-4 w-full">
              <div className="flex flex-col items-start gap-1.5 flex-1">
                <div className="flex flex-col items-start gap-1.5 w-full">
                  <Label
                    htmlFor="category"
                    className="font-medium text-sm text-[#344054]"
                  >
                    Category
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger
                      id="category"
                      className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                    >
                      <SelectValue
                        placeholder="Select a category"
                        className="text-[#667085]"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((categoryOption) => (
                        <SelectItem 
                          key={categoryOption.value} 
                          value={categoryOption.value}
                        >
                          {categoryOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col items-start gap-1.5 flex-1">
                <Label
                  htmlFor="subject"
                  className="font-medium text-sm text-[#344054]"
                >
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="Enter the Subject"
                  className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-[#667085]"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col h-[180px] items-start gap-1.5 w-full">
              <div className="flex flex-col items-start gap-1.5 w-full h-full">
                <Label
                  htmlFor="description"
                  className="font-medium text-sm text-[#344054]"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter a description..."
                  className="flex-1 w-full h-full min-h-[150px] bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button 
            className="w-[165px] bg-teal-700 hover:bg-teal-800 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

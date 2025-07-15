"use client"

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { createTicket } from "@/app/actions/tickets";
import { useToast } from "@/components/ui/use-toast";

export const ContactForm = (): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  // Form field data
  const formFields = [
    { id: "name", label: "Name", type: "text", placeholder: "Enter your name" },
    {
      id: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter your email",
    },
  ];

  const handleSubmit = async () => {
    try {
      // Validate form fields
      if (!name.trim()) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please enter your name."
        });
        return;
      }

      if (!email.trim()) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please enter your email address."
        });
        return;
      }

      if (!message.trim()) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please enter a message."
        });
        return;
      }

      // Prepare ticket data
      const ticketData = {
        title: `Contact Form Submission from ${name}`,
        description: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`,
        email: email,
        name: name,
        category: "contact-form", // Default category for contact form
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
          description: "We couldn't send your message. Please try again later."
        });
      } else {
        toast({
          variant: "default",
          title: "Message Sent",
          description: "Thank you for contacting us. We'll get back to you soon."
        });
        
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We couldn't send your message. Please try again later."
      });
      console.error("Error submitting contact form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-end justify-between gap-6 p-6 relative bg-[#3c87870d] rounded-[12px] lg:rounded-[0px_12px_12px_0px] overflow-hidden w-full h-full">
      <div className="flex-col items-start gap-[22px] flex relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
          {formFields.map((field) => (
            <div
              key={field.id}
              className="flex flex-col items-start gap-1.5 relative w-full flex-1"
            >
              <Label
                htmlFor={field.id}
                className="font-text-sm-medium text-[#344054] text-[length:var(--text-sm-medium-font-size)] tracking-[var(--text-sm-medium-letter-spacing)] leading-[var(--text-sm-medium-line-height)]"
              >
                {field.label}
              </Label>
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                className="h-12 w-full"
                value={field.id === "name" ? name : email}
                onChange={(e) => field.id === "name" ? setName(e.target.value) : setEmail(e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="items-center gap-1.5 flex relative self-stretch w-full flex-[0_0_auto]">
              <Label
                htmlFor="phone"
                className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5"
              >
                Phone number
              </Label>
            </div>
            <div className="flex h-12 w-full">
              <Select>
                <SelectTrigger className="w-[70px] border-r-0 rounded-r-none bg-background">
                  <SelectValue placeholder="US" />
                </SelectTrigger>
              </Select>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="flex-1 rounded-l-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col h-[180px] items-start gap-1.5 relative self-stretch w-full">
          <div className="flex flex-col items-start gap-1.5 relative flex-1 self-stretch w-full grow">
            <Label
              htmlFor="message"
              className="font-text-sm-medium text-[#344054] text-[length:var(--text-sm-medium-font-size)] tracking-[var(--text-sm-medium-letter-spacing)] leading-[var(--text-sm-medium-line-height)]"
            >
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Enter a message..."
              className="flex-1 min-h-[140px] w-full resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button 
        className="w-full bg-[#0e7c86] hover:bg-[#0a6971] text-white"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Send"}
      </Button>
    </div>
  );
};

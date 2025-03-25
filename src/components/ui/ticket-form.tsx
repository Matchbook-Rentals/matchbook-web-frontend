"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { createTicket } from "@/app/actions/tickets"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUser } from "@clerk/nextjs"
import { usePathname, useSearchParams } from "next/navigation"

interface TicketFormProps {
  onSubmitSuccess?: () => void
  className?: string
  formId?: string
}

export function TicketForm({
  onSubmitSuccess,
  className = "grid gap-4 py-4",
  formId = "ticket-form"
}: TicketFormProps) {
  const { toast } = useToast()
  const { isSignedIn } = useAuth()
  const { user } = useUser();
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    // Use authenticated user email if available
    let email = "";

    if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      email = user.primaryEmailAddress.emailAddress;
      console.log("Using authenticated user email:", email);
    } else {
      email = formData.get("email") as string;
      console.log("Using form email input:", email);
    }

    // Build the complete URL using environment variable and pathname
    const baseUrl = process.env.NEXT_PUBLIC_URL || '';
    const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const currentUrl = `${baseUrl}${pathname}${search}`;

    // Validate required fields before submission
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!title || !description || !email) {
      console.log("Client-side validation failed:", { title, description, email });
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const data = {
      title,
      description,
      email,
      name: isSignedIn && user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (formData.get("name") as string),
      category: formData.get("category") as string,
      pageUrl: currentUrl,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }

    console.log("Submitting ticket data:", { ...data, description: data.description.substring(0, 20) + '...' });

    try {
      const result = await createTicket(data)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Your support ticket has been submitted.",
        })

        // Reset the form
        event.currentTarget.reset()

        // Call the success callback if provided
        if (onSubmitSuccess) {
          onSubmitSuccess()
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className={className}
      onSubmit={handleSubmit}
      id={formId}
    >
      {/* Only show email field if user is not signed in */}
      {!isSignedIn && (
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email (required):
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="input w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            required
          />
        </div>
      )}

      {/* Only show name field if user is not signed in */}
      {!isSignedIn && (
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="input w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          />
        </div>
      )}

      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Subject (required):
        </label>
        <input
          type="text"
          id="title"
          name="title"
          className="input w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          required
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description (required):
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="textarea w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          required
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="category" className="text-sm font-medium">
          Category:
        </label>
        <select
          id="category"
          name="category"
          className="select w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="">Select a category</option>
          <option value="bug">Bug Report</option>
          <option value="feature-request">Feature Request</option>
          <option value="account">Account Issue</option>
          <option value="billing">Billing Question</option>
          <option value="other">Other</option>
        </select>
      </div>

      <Button type="submit" className="mt-4 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  )
}

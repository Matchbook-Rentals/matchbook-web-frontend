"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TicketForm } from "@/components/ui/ticket-form"

interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent xOnRight className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="pb-2">Support</DialogTitle>
          <DialogDescription>
            How can we help you today?
          </DialogDescription>
        </DialogHeader>
        <TicketForm 
          formId="support-form"
          onSubmitSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

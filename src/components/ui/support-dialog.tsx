"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  return (
    <Dialog  open={open} onOpenChange={onOpenChange}>
      <DialogContent xOnRight className="sm:max-w-[425px] ">
        <DialogHeader>
          <DialogTitle className="pb-2">Support</DialogTitle>
          <DialogDescription>
            How can we help you today?
          </DialogDescription>
        </DialogHeader>
<form 
  className="grid gap-4 py-4"
  action="/submit-ticket" 
  method="post" 
  encType="multipart/form-data"
>
  <div className="grid gap-2">
    <label htmlFor="email" className="text-sm font-medium">
      Email (required):
    </label>
    <input
      type="email"
      id="email"
      name="email"
      className="input w-full"
      required
    />
  </div>
  <div className="grid gap-2">
    <label htmlFor="name" className="text-sm font-medium">
      Name:
    </label>
    <input
      type="text"
      id="name"
      name="name"
      className="input w-full"
    />
  </div>
  <div className="grid gap-2">
    <label htmlFor="subject" className="text-sm font-medium">
      Subject (required):
    </label>
    <input
      type="text"
      id="subject"
      name="subject"
      className="input w-full"
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
      className="textarea w-full"
      required
    />
  </div>
  <div className="grid gap-2">
    <label htmlFor="priority" className="text-sm font-medium">
      Priority:
    </label>
    <select 
      id="priority" 
      name="priority"
      className="select w-full"
    >
      <option value="1">Low</option>
      <option value="2">Medium</option>
      <option value="3">High</option>
      <option value="4">Urgent</option>
    </select>
  </div>
  <div className="grid gap-2">
    <label htmlFor="type" className="text-sm font-medium">
      Type:
    </label>
    <input
      type="text"
      id="type"
      name="type"
      className="input w-full"
    />
  </div>
  <div className="grid gap-2">
    <label htmlFor="attachments" className="text-sm font-medium">
      Attachments:
    </label>
    <input
      type="file"
      id="attachments"
      name="attachments"
      multiple
      className="file-input w-full"
    />
  </div>
</form>
        <DialogFooter>
          <Button type="submit" form="support-form">
            Submit Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

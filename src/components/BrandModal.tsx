'use client'

import React, { useState } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/brandDialog"

interface BrandModalProps {
  children: React.ReactNode
  triggerButton?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  heightStyle?: string
  className?: string
}

export default function BrandModal({ 
  children,
  triggerButton,
  isOpen: controlledIsOpen,
  onOpenChange,
  heightStyle = "!top-[10vh] md:!top-[25vh]",
  className = "max-w-2xl"
}: BrandModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = onOpenChange || setInternalIsOpen

  const defaultTrigger = (
    <button onClick={() => setIsOpen(true)}>
      Open Modal
    </button>
  )

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setIsOpen(true)}>
          {triggerButton}
        </div>
      ) : (
        null
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`${className} ${heightStyle}`} showCloseButton={false}>
          {children}
        </DialogContent>
      </Dialog>
    </>
  )
}

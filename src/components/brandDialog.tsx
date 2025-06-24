"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

// Base Radix Dialog components
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// Brand Dialog specific interface
interface BrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleComponent?: React.ReactNode;
  contentComponent: React.ReactNode;
  footerComponent?: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
}

export const BrandDialog: React.FC<BrandDialogProps> = ({
  open,
  onOpenChange,
  titleComponent,
  contentComponent,
  footerComponent,
  currentStep = 1,
  totalSteps = 3,
}) => {
  // Generate steps based on props
  const steps = Array.from({ length: totalSteps }, (_, index) => ({
    status: index < currentStep ? "active" : "inactive"
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="flex flex-col items-center gap-6 p-6 bg-white w-full max-w-[821px] mx-auto border-0 shadow-lg"
        showCloseButton={false}
      >
        {titleComponent && (
          <div className="flex items-center justify-between relative self-stretch w-full">
            <DialogClose asChild>
              <button className="p-1 hover:bg-gray-100 rounded-sm transition-colors">
                <XIcon className="w-6 h-6 text-gray-500" />
                <span className="sr-only">Close</span>
              </button>
            </DialogClose>
            {titleComponent}
            <div className="w-6 h-6" /> {/* Empty div for spacing */}
          </div>
        )}

        <div className="flex w-full items-center justify-center">
          <div className="flex w-[368px] items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                {/* Step circle */}
                <div className="inline-flex items-start relative">
                  <div
                    className={`relative w-6 h-6 rounded-full overflow-hidden ${
                      step.status === "active"
                        ? "bg-[#f9f5ff] shadow-[0px_0px_0px_4px_#3c87873d]"
                        : "bg-gray-50"
                    }`}
                  >
                    <div
                      className={`h-6 rounded-xl border-[1.5px] border-solid ${
                        step.status === "active"
                          ? "bg-[#3c8787]"
                          : "border-[#eaecf0]"
                      }`}
                    >
                      <div
                        className={`relative w-2 h-2 top-2 left-2 rounded ${
                          step.status === "active" ? "bg-white" : "bg-[#d0d5dd]"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Connector line (except after the last step) */}
                {index < steps.length - 1 && (
                  <div className="relative w-20 h-0.5 bg-[#0b6969]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 relative self-stretch w-full">
          {contentComponent}
          {footerComponent && (
            <div className="pt-6 border-t border-gray-200">
              {footerComponent}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export the base components for reusability
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
};

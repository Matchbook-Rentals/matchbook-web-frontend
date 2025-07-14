"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon, CheckIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

// Custom hook to get base URL safely
const useBaseUrl = () => {
  const [baseUrl, setBaseUrl] = React.useState('')
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(`${window.location.protocol}//${window.location.host}`)
    }
  }, [])
  
  return baseUrl
}

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
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[5vh] sm:top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-0 sm:translate-y-[-20%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-2 left-2 h-8 w-8 flex items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none cursor-pointer"
          >
            <XIcon className="h-5 w-5 sm:h-6 sm:w-6 stroke-2 pointer-events-none" />
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
  contentComponent?: React.ReactNode;
  carouselContent?: React.ReactNode[];
  footerComponent?: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
}

export const BrandDialog: React.FC<BrandDialogProps> = ({
  open,
  onOpenChange,
  titleComponent,
  contentComponent,
  carouselContent,
  footerComponent,
  currentStep = 1,
  totalSteps = 3,
}) => {
  const contentRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Generate steps based on props
  const steps = Array.from({ length: totalSteps }, (_, index) => {
    if (index < currentStep - 1) return { status: "completed" };
    if (index === currentStep - 1) return { status: "active" };
    return { status: "inactive" };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="flex flex-col items-center gap-6 p-6 bg-white w-full max-w-[98%] md:w-[95%] md:max-w-[1000px] mx-auto border-0 shadow-lg top-[5vh] sm:top-[10vh] md:top-[15vh] lg:top-[25vh] translate-y-0"
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
                        : step.status === "completed"
                        ? "bg-[#0b6969]"
                        : "bg-gray-50"
                    }`}
                  >
                    <div
                      className={`h-6 rounded-xl border-[1.5px] border-solid flex items-center justify-center ${
                        step.status === "active"
                          ? "bg-[#3c8787]"
                          : step.status === "completed"
                          ? "bg-[#0b6969] border-[#0b6969]"
                          : "border-[#eaecf0]"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <CheckIcon className="w-5 h-5 text-white stroke-[3]" />
                      ) : (
                        <div
                          className={`w-2 h-2 rounded ${
                            step.status === "active" ? "bg-white" : "bg-[#d0d5dd]"
                          }`}
                        />
                      )}
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

        <div className="flex flex-col gap-6 relative self-stretch w-full min-w-0 max-h-[70vh] lg:max-h-[85vh] overflow-hidden">
          <div className="min-w-0 overflow-y-auto overflow-x-hidden flex-1">
            {carouselContent ? (
              <div className="relative overflow-x-hidden">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
                >
                  {carouselContent.map((content, index) => (
                    <div 
                      key={index} 
                      ref={(el) => (contentRefs.current[index] = el)}
                      className="w-full flex-shrink-0 transition-all duration-300 ease-in-out"
                      style={{ 
                        height: index === currentStep - 1 ? 'auto' : '0px',
                        overflow: index === currentStep - 1 ? 'visible' : 'hidden'
                      }}
                    >
                      {content}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              contentComponent
            )}
          </div>
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

// Stripe Connect verification dialog component
interface StripeConnectVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const StripeConnectVerificationDialog: React.FC<StripeConnectVerificationDialogProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const [hasStripeAccount, setHasStripeAccount] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const baseUrl = useBaseUrl();

  // Check user's Stripe account status when dialog opens
  React.useEffect(() => {
    const checkStripeAccount = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/user/stripe-account');
          const data = await response.json();
          setHasStripeAccount(Boolean(data.stripeAccountId));
        } catch (error) {
          console.error('Error checking Stripe account:', error);
          setHasStripeAccount(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkStripeAccount();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="flex flex-col items-center gap-6 p-6 bg-white w-full max-w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between relative self-stretch w-full">
          <DialogClose asChild>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <XIcon className="w-6 h-6 text-gray-500" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
          <h2 className="text-lg font-semibold text-gray-900">Payment Setup Required</h2>
          <div className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-4 text-center">
          {isLoading ? (
            <>
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Checking for Payment Information
                </h3>
                <p className="text-gray-600">
                  Please wait while we verify your payment account setup...
                </p>
              </div>
            </>
          ) : !hasStripeAccount ? (
            <>
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Stripe Connect Setup Required
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Before you can approve applications and create leases, you need to set up your payment account with Stripe Connect. 
                  This allows you to securely receive rent payments and security deposits from tenants.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">What you&apos;ll need:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Business or personal tax information</li>
                  <li>• Bank account details for deposits</li>
                  <li>• Government-issued ID</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Payment Account Found
                </h3>
                <p className="text-gray-600">
                  Your Stripe Connect account is set up and ready. You can now proceed with creating the lease.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </Button>
          {isLoading ? (
            <Button
              disabled
              className="flex-1 h-12 rounded-lg bg-gray-400 text-white"
            >
              Checking...
            </Button>
          ) : !hasStripeAccount ? (
            <Button
              onClick={async () => {
                setIsLoading(true);
                try {
                  // First, create a Standard Stripe account without preloading business type
                  const createResponse = await fetch('/api/payment/account-create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({}),
                  });
                  
                  const createData = await createResponse.json();
                  if (createData.error) {
                    console.error('Error creating Stripe account:', createData.error);
                    setIsLoading(false);
                    return;
                  }
                  
                  // Get current URL to return to after onboarding
                  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
                  
                  // Create callback URLs with the current page as redirect destination
                  const callbackUrl = new URL('/stripe-callback', window.location.origin);
                  callbackUrl.searchParams.set('redirect_to', currentUrl);
                  callbackUrl.searchParams.set('account_id', createData.account);
                  
                  // Create refresh URL for expired/visited links
                  const refreshUrl = new URL('/stripe-callback', window.location.origin);
                  refreshUrl.searchParams.set('redirect_to', currentUrl);
                  refreshUrl.searchParams.set('account_id', createData.account);
                  
                  // Then create an account link for hosted onboarding
                  const linkResponse = await fetch('/api/payment/account-link', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                      account: createData.account,
                      returnUrl: callbackUrl.toString(),
                      refreshUrl: refreshUrl.toString()
                    }),
                  });
                  
                  const linkData = await linkResponse.json();
                  if (linkData.url) {
                    // Redirect to Stripe's hosted onboarding
                    window.location.href = linkData.url;
                  } else {
                    console.error('Error creating account link:', linkData.error);
                    setIsLoading(false);
                  }
                } catch (error) {
                  console.error('Error setting up Stripe payments:', error);
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="flex-1 h-12 rounded-lg bg-[#3c8787] hover:bg-[#2d6565] text-white disabled:opacity-50"
            >
              Set Up Payments
            </Button>
          ) : (
            <Button
              onClick={() => {
                onContinue();
                onClose();
              }}
              className="flex-1 h-12 rounded-lg bg-[#39b54a] hover:bg-[#2d8a3a] text-white flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Lease
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export the base components for reusability
// Simple Close Button Component
function DialogCloseButton({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "absolute left-2 top-2 h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center cursor-pointer rounded-sm opacity-70 hover:opacity-100 transition-opacity z-50",
        className
      )}
      {...props}
    >
      <XIcon className="h-4 w-4 sm:h-5 sm:w-5 stroke-2" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogCloseButton,
  DialogOverlay,
  DialogContent,
};

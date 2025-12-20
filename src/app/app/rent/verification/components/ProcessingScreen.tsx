"use client"

import { CheckCircle2, Loader2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateOfBirthPicker } from "@/components/ui/date-of-birth-picker";
import { VerificationPaymentSelector, SavedPaymentMethod } from "@/components/stripe/verification-payment-selector";
import { VerificationFooter } from "./VerificationFooter";
import { SupportDialog } from "@/components/ui/support-dialog";
import { toast } from "sonner";
import type { ISoftPullResponse } from "@/types/isoftpull";
import type { VerificationFormValues } from "../utils";

export interface ErrorHandlers {
  handleRefund: () => Promise<void>;
  handleRetry: () => Promise<void>;
  isProcessingRefund: boolean;
  isRetrying: boolean;
}

interface ProcessingScreenProps {
  form: UseFormReturn<VerificationFormValues>;
  onComplete?: () => void;
  onBack?: () => void;
  onStepChange?: (step: ProcessingStep) => void;
  onPaymentMethodReady?: (canPay: boolean, paymentMethodId: string | null) => void;
  onCreditDataReceived?: (data: ISoftPullResponse) => void;
  onErrorHandlers?: (handlers: ErrorHandlers) => void;
  selectedPaymentMethodId?: string | null;
  shouldStartPayment?: boolean;
  initialPaymentMethods?: SavedPaymentMethod[];
  initialClientSecret?: string | null;
  // FCRA Consent timestamps for audit logging
  backgroundCheckConsentAt?: Date | null;
  creditCheckConsentAt?: Date | null;
}

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export type ProcessingStep =
  | "select-payment"
  | "payment"
  | "isoftpull"
  | "accio"
  | "polling"
  | "complete"
  | "ssn-error"
  | "refund-success"
  | "verification-failed"
  | "no-credit-file";

const stepLabels: Record<ProcessingStep, string> = {
  "select-payment": "Preparing your verification...",
  payment: "Authorizing payment...",
  isoftpull: "Gathering information...",
  accio: "Performing background checks...",
  polling: "Finalizing payment...",
  complete: "Verification Complete!",
  "ssn-error": "SSN Verification Failed",
  "refund-success": "Refund Processed",
  "verification-failed": "Verification Could Not Be Completed",
  "no-credit-file": "No Credit File Found",
};

export const ProcessingScreen = ({
  form,
  onComplete,
  onBack,
  onStepChange,
  onPaymentMethodReady,
  onCreditDataReceived,
  onErrorHandlers,
  selectedPaymentMethodId,
  shouldStartPayment,
  initialPaymentMethods,
  initialClientSecret,
  backgroundCheckConsentAt,
  creditCheckConsentAt,
}: ProcessingScreenProps): JSX.Element => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("select-payment");
  const [completedSteps, setCompletedSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [ssnAttemptCount, setSsnAttemptCount] = useState(0);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<string | null>(null);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Get form data for API calls
  const formData = form.getValues();

  // Track form changes when in error state
  const formValues = form.watch();
  useEffect(() => {
    if (currentStep === "ssn-error" || currentStep === "no-credit-file") {
      if (!initialFormValues) {
        setInitialFormValues(JSON.stringify(form.getValues()));
      }
    } else {
      setInitialFormValues(null);
      setHasFormChanges(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (initialFormValues) {
      const currentValues = JSON.stringify(formValues);
      setHasFormChanges(currentValues !== initialFormValues);
    }
  }, [formValues, initialFormValues]);

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  // Expose error handlers to parent for footer buttons
  useEffect(() => {
    if (onErrorHandlers && (currentStep === "ssn-error" || currentStep === "no-credit-file")) {
      onErrorHandlers({
        handleRefund: handleCancelPayment,
        handleRetry,
        isProcessingRefund,
        isRetrying,
      });
    }
  }, [currentStep, isProcessingRefund, isRetrying, onErrorHandlers]);

  // Auto-proceed to report after verification completes
  useEffect(() => {
    if (currentStep === "complete" && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  // Handle payment trigger from parent component
  useEffect(() => {
    if (shouldStartPayment && selectedPaymentMethodId && !isProcessingPayment && currentStep === "select-payment") {
      setCurrentStep("payment");
    }
  }, [shouldStartPayment, selectedPaymentMethodId, isProcessingPayment, currentStep]);

  // Handle payment processing when payment step is reached
  useEffect(() => {
    if (currentStep === "payment" && selectedPaymentMethodId && !isProcessingPayment) {
      processPayment();
    }
  }, [currentStep, selectedPaymentMethodId, isProcessingPayment]);

  // Process payment with the selected payment method
  const processPayment = async () => {
    if (!selectedPaymentMethodId) return;

    setIsProcessingPayment(true);
    setError(null);

    try {
      console.log('💳 Creating payment intent with saved method:', selectedPaymentMethodId);

      // Step 1: Create payment intent
      const response = await fetch('/api/verification/charge-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: selectedPaymentMethodId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId: newPaymentIntentId } = data;

      if (!clientSecret) {
        throw new Error('No client secret returned from server');
      }

      // Store paymentIntentId for later capture/cancel
      setPaymentIntentId(newPaymentIntentId);

      console.log('✅ Payment intent created (pre-auth hold), confirming with Stripe...');

      // Step 2: Load Stripe and confirm payment
      const stripe = await import('@stripe/stripe-js').then(m =>
        m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      );

      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error: confirmError } = await stripe.confirmPayment({
        clientSecret,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/app/rent/verification`,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      console.log('✅ Payment confirmed, starting polling...');

      // Step 3: Poll for payment status (hold is placed when status is requires_capture)
      const success = await pollPaymentStatus(newPaymentIntentId);

      if (success) {
        console.log('✅ Payment successful');
        handlePaymentSuccess();
      } else {
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payment');
      setIsProcessingPayment(false);
    }
  };

  // Poll for payment status
  const pollPaymentStatus = async (paymentIntentId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let pollCount = 0;
      const maxPolls = 40; // 40 polls * 3 seconds = 2 minutes max

      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          console.log(`🔍 Polling payment status (${pollCount}/${maxPolls})...`);

          const response = await fetch(`/api/verification/payment-status?paymentIntentId=${paymentIntentId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to check payment status');
          }

          console.log('📊 Payment status:', data.status);

          // With manual capture (pre-auth), 'requires_capture' means hold is placed successfully
          // 'succeeded' means already captured, 'processing' is for ACH/bank transfers
          if (data.status === 'requires_capture' || data.status === 'succeeded' || data.status === 'processing') {
            clearInterval(pollInterval);
            console.log('✅ Payment hold placed successfully (requires_capture) or already captured');
            resolve(true);
          } else if (data.status === 'canceled' || data.status === 'failed' || data.status === 'requires_payment_method') {
            clearInterval(pollInterval);
            console.error('❌ Payment failed');
            setError(data.error || 'Payment failed. Please try a different payment method.');
            resolve(false);
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            console.error('❌ Payment polling timeout');
            setError('Payment is taking longer than expected. Please check back later.');
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Error polling payment status:', error);
          clearInterval(pollInterval);
          setError('Failed to check payment status');
          resolve(false);
        }
      }, 3000); // Poll every 3 seconds
    });
  };

  // Handle payment success - called after payment is confirmed
  const handlePaymentSuccess = async () => {
    // Mark payment complete, move to credit check
    setCompletedSteps(prev => [...prev, "select-payment", "payment"]);
    setCurrentStep("isoftpull");

    // Submit verification (two-tier flow)
    await submitVerification();
  };

  // Handle retry after error - user has updated their info
  const handleRetry = async () => {
    setIsRetrying(true);
    setInitialFormValues(null);
    setHasFormChanges(false);
    setCurrentStep("isoftpull");
    await submitVerification();
    setIsRetrying(false);
  };

  // Handle cancel payment - releases the pre-auth hold (no charge made)
  const handleCancelPayment = async () => {
    if (!paymentIntentId) {
      setRefundError('No payment found to cancel.');
      return;
    }

    setIsProcessingRefund(true);
    setRefundError(null);

    try {
      const response = await fetch('/api/verification/cancel-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRefundError(data.error || 'Failed to process refund. Please contact support.');
        setIsProcessingRefund(false);
        return;
      }

      console.log('✅ Payment hold released');
      setCurrentStep("refund-success");
    } catch (error) {
      console.error('❌ Cancel payment error:', error);
      setRefundError('Failed to process refund. Please try again or contact support.');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Auto-cancel payment on second verification failure (no user action needed)
  const autoCancelPayment = async () => {
    if (!paymentIntentId) {
      console.error('❌ No payment intent to cancel');
      setCurrentStep("verification-failed"); // Still show failure screen, nothing was charged
      return;
    }

    console.log('🔄 Auto-canceling payment after second failure...');

    try {
      const response = await fetch('/api/verification/cancel-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to auto-cancel payment:', data.error);
        // Still show failure screen - the hold will expire anyway
      } else {
        console.log('✅ Payment auto-canceled successfully');
      }
    } catch (error) {
      console.error('❌ Error auto-canceling payment:', error);
    }

    setCurrentStep("verification-failed");
  };

  // Submit verification to API - single orchestrated call
  const submitVerification = async () => {
    // Get fresh form values
    const currentFormData = form.getValues();

    try {
      console.log("📤 Calling verification orchestrator...");

      // Single API call that handles the entire flow server-side
      const response = await fetch("/api/verification/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: currentFormData.firstName,
          lastName: currentFormData.lastName,
          address: currentFormData.address,
          city: currentFormData.city,
          state: currentFormData.state,
          zip: currentFormData.zip,
          ssn: currentFormData.ssn,
          dob: currentFormData.dob,
          // FCRA audit timestamps
          creditCheckConsentAt: creditCheckConsentAt?.toISOString(),
          backgroundCheckConsentAt: backgroundCheckConsentAt?.toISOString(),
        }),
      });

      const data = await response.json();
      console.log("📥 Verification response:", data);

      // Handle credit check errors (SSN or no credit file)
      if (!data.success) {
        if (data.errorType === "INVALID_SSN" || data.errorType === "NO_CREDIT_FILE") {
          console.log("⚠️ Credit check failed:", data.errorType, "attempt:", ssnAttemptCount + 1);
          const newAttemptCount = ssnAttemptCount + 1;
          setSsnAttemptCount(newAttemptCount);

          if (newAttemptCount === 1) {
            // First failure - show retry screen
            setCurrentStep(data.errorType === "INVALID_SSN" ? "ssn-error" : "no-credit-file");
          } else {
            // Second failure - auto-cancel payment and show refund success
            await autoCancelPayment();
          }
          return;
        }

        // Other errors
        throw new Error(data.message || data.error || "Verification failed");
      }

      // Success - pass credit data to parent if available
      if (data.creditData && onCreditDataReceived) {
        onCreditDataReceived(data.creditData);
      }

      // Mark all steps complete
      setCompletedSteps(prev => [...prev, "isoftpull", "accio"]);
      setCurrentStep("polling");

      // Capture the payment now that verification succeeded
      if (paymentIntentId) {
        console.log('💰 Capturing payment hold...');
        try {
          const captureResponse = await fetch('/api/verification/capture-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId }),
          });

          if (!captureResponse.ok) {
            const captureData = await captureResponse.json();
            console.error('❌ Failed to capture payment:', captureData.error);
          } else {
            console.log('✅ Payment captured successfully');
          }
        } catch (captureError) {
          console.error('❌ Error capturing payment:', captureError);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      setCompletedSteps(prev => [...prev, "polling"]);
      setCurrentStep("complete");
      setShowPendingMessage(true);

    } catch (err) {
      console.error("Verification submission error:", err);
      const message = err instanceof Error ? err.message : "Failed to submit verification";

      // Show toast for service unavailable errors
      if (message.includes("temporarily unavailable") || message.includes("not configured")) {
        toast.error("Service Temporarily Unavailable", {
          description: "Please try again in a few minutes. If the problem persists, contact support.",
        });
      }

      setError(message);
    }
  };


  const isStepComplete = (step: ProcessingStep) => completedSteps.includes(step);
  const isStepCurrent = (step: ProcessingStep) => currentStep === step;
  const isStepError = (step: ProcessingStep) => error && (step === currentStep);

  return (
    <div className="flex flex-col w-full items-start justify-center gap-4 p-2 md:p-4 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <img src="/logo-small.svg" alt="Home" className="w-[18px] h-[18px] -translate-y-[1px]" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>MatchBook Renter Verification</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col items-start justify-center gap-6 w-full">
        <div className="flex flex-col w-full items-start gap-1">
          <h1 className="font-text-heading-medium-medium text-[#373940] text-2xl">
            {currentStep === "complete"
              ? "Verification Complete"
              : currentStep === "select-payment"
              ? "Payment Required"
              : currentStep === "ssn-error"
              ? "SSN Verification Failed"
              : currentStep === "no-credit-file"
              ? "No Credit File Found"
              : currentStep === "refund-success"
              ? "Refund Processed"
              : currentStep === "verification-failed"
              ? "Verification Could Not Be Completed"
              : "Processing Your Verification"}
          </h1>

          <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
            {currentStep === "complete"
              ? "Your background check has been completed successfully."
              : currentStep === "select-payment"
              ? "Complete payment to begin your verification process."
              : currentStep === "ssn-error"
              ? "Please double-check your Social Security Number and other details below."
              : currentStep === "no-credit-file"
              ? "Please verify your information below is correct."
              : currentStep === "refund-success"
              ? "Your refund has been processed."
              : currentStep === "verification-failed"
              ? "We've refunded your payment."
              : "Please wait while we process your verification checks."}
          </p>
        </div>

        {/* Payment Selector - Show when on payment selection step */}
        {currentStep === "select-payment" && !isStepComplete("select-payment") && (
          <>
            {/* Receipt Summary */}
            <div className="w-full rounded-xl border border-[#e6e6e6] bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/tick.svg" alt="" className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-sm">
                    Renter Verification
                  </span>
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-xs">
                    Includes credit range, background check, and eviction history, valid for 90 days
                  </span>
                </div>
              </div>
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-sm whitespace-nowrap">
                Pay $25.00
              </span>
            </div>

            <VerificationPaymentSelector
              formData={formData}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={onBack || (() => window.history.back())}
              onPaymentMethodReady={onPaymentMethodReady}
              initialPaymentMethods={initialPaymentMethods}
              initialClientSecret={initialClientSecret}
            />
          </>
        )}

        {/* Error Screen with Inline Form - SSN Error or No Credit File */}
        {(currentStep === "ssn-error" || currentStep === "no-credit-file") && (
          <div className="flex flex-col items-center gap-6 py-6 w-full">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-base text-center max-w-lg">
              {currentStep === "ssn-error"
                ? "We couldn't verify your SSN. Please double-check your information below and try again."
                : "We couldn't find a credit file matching your information. Please verify your details below are correct."}
            </p>

            {/* Inline Form Fields */}
            <div className="flex flex-col gap-5 w-full max-w-lg bg-neutral-50 rounded-xl p-4 md:p-6">
              {/* SSN and DOB Row */}
              <div className="flex flex-wrap md:flex-nowrap items-start gap-4 w-full">
                <FormField
                  control={form.control}
                  name="ssn"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-0 md:min-w-[200px]">
                      <FormLabel className="inline-flex items-center gap-1.5">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                          Social Security Number
                        </span>
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="123-45-6789"
                          maxLength={11}
                          className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                          value={field.value ? field.value.replace(/(\d{3})(\d{2})(\d{0,4})/, (_, a, b, c) => c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a) : ''}
                          onChange={(e) => {
                            // Strip non-digits and store raw value
                            const rawValue = e.target.value.replace(/\D/g, '').slice(0, 9);
                            field.onChange(rawValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-0 md:min-w-[200px]">
                      <FormLabel className="inline-flex items-center gap-1.5">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                          Date of Birth
                        </span>
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <DateOfBirthPicker
                          value={field.value ? (() => {
                            const [year, month, day] = field.value.split('-').map(Number);
                            return new Date(year, month - 1, day);
                          })() : null}
                          onChange={(date) => {
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              field.onChange(`${year}-${month}-${day}`);
                            } else {
                              field.onChange('');
                            }
                          }}
                          placeholder="MM/DD/YYYY"
                          className="h-12 border-[#d0d5dd] shadow-shadows-shadow-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start gap-1.5 w-full">
                    <FormLabel className="inline-flex items-center gap-1.5">
                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                        Street Address
                      </span>
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Street Address"
                        className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City, State, Zip Row */}
              <div className="flex flex-wrap md:flex-nowrap items-start gap-4 w-full">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-0 md:min-w-[140px]">
                      <FormLabel className="inline-flex items-center gap-1.5">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                          City
                        </span>
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter City"
                          className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-0 md:min-w-[140px]">
                      <FormLabel className="inline-flex items-center gap-1.5">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                          State
                        </span>
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-0 md:min-w-[120px]">
                      <FormLabel className="inline-flex items-center gap-1.5">
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                          Zip Code
                        </span>
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Zip"
                          maxLength={10}
                          className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                          {...field}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d-]/g, '');
                            if (value.length > 5 && !value.includes('-')) {
                              value = value.substring(0, 5) + '-' + value.substring(5, 9);
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Refund Error Display */}
            {refundError && (
              <div className="w-full max-w-lg bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-red-700 text-sm">
                    {refundError}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons moved to fixed footer via onErrorHandlers */}
          </div>
        )}

        
        {/* Verification Failed Screen - Auto-refund after second failure */}
        {currentStep === "verification-failed" && (
          <div className="flex flex-col items-center justify-center gap-8 py-12 w-full min-h-[300px]">
            <AlertCircle className="w-16 h-16 text-amber-500" />
            <div className="flex flex-col items-center gap-4 max-w-md text-center">
              <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-2xl">
                We Couldn&apos;t Complete Your Verification
              </h3>
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-base">
                Unfortunately, the information provided doesn&apos;t match what&apos;s on file with our credit data providers. This can happen for a variety of reasons.
              </p>
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-base">
                Don&apos;t worry, your $25 has been refunded.
              </p>
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm mt-2">
                If you believe this is an error or need assistance, please contact our support team.
              </p>
              {/* Action buttons in fixed footer */}
            </div>
          </div>
        )}

        {/* Refund Success Screen - User requested refund */}
        {currentStep === "refund-success" && (
          <div className="flex flex-col items-center justify-center gap-8 py-12 w-full min-h-[300px]">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <div className="flex flex-col items-center gap-4 max-w-md text-center">
              <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-2xl">
                Refund Processed
              </h3>
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-base">
                Your $25 refund has been processed.
              </p>
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm mt-2">
                If you have any questions, please don&apos;t hesitate to contact our support team.
              </p>
              {/* Action buttons in fixed footer */}
            </div>
          </div>
        )}

        {/* Processing Status - Centered spinner with sliding text */}
        {currentStep !== "select-payment" && currentStep !== "ssn-error" && currentStep !== "refund-success" && currentStep !== "verification-failed" && currentStep !== "no-credit-file" && (
          <div className="flex flex-col items-center justify-center gap-8 py-12 w-full min-h-[300px]">
              {/* Spinner */}
              {error ? (
                <AlertCircle className="w-16 h-16 text-red-600" />
              ) : currentStep === "complete" ? (
                <div className="w-16 h-16" />
              ) : (
                <Loader2 className="w-16 h-16 text-[#0b6969] animate-spin" />
              )}

              {/* Sliding Status Text */}
              <div className="relative w-full flex justify-center items-center overflow-hidden min-h-[60px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute"
                  >
                    <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-2xl text-center">
                      {error || stepLabels[currentStep]}
                    </h3>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Additional info for complete state */}
              {currentStep === "complete" && (
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-lg text-center max-w-md">
                  Proceeding to report...
                </p>
              )}
          </div>
        )}

        {/* Error Display */}
        {error && currentStep !== "isoftpull" && (
          <Card className="w-full rounded-xl border border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="[font-family:'Poppins',Helvetica] font-semibold text-red-900 text-sm">
                    Error
                  </p>
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-red-700 text-sm mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Support Dialog */}
      <SupportDialog
        open={showSupportDialog}
        onOpenChange={setShowSupportDialog}
      />
    </div>
  );
};

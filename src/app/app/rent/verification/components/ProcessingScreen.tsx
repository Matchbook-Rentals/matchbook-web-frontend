"use client"

import { HomeIcon, CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import React, { useState, useEffect } from "react";
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
import { BrandButton } from "@/components/ui/brandButton";
import { VerificationPaymentSelector } from "@/components/stripe/verification-payment-selector";
import { VerificationFooter } from "./VerificationFooter";

interface ProcessingScreenProps {
  formData: any;
  onComplete?: () => void;
  onBack?: () => void;
  onStepChange?: (step: ProcessingStep) => void;
  onPaymentMethodReady?: (canPay: boolean, paymentMethodId: string | null) => void;
  selectedPaymentMethodId?: string | null;
  shouldStartPayment?: boolean;
}

export type ProcessingStep =
  | "select-payment"
  | "payment"
  | "isoftpull"
  | "accio"
  | "polling"
  | "complete";

const stepLabels: Record<ProcessingStep, string> = {
  "select-payment": "Preparing your verification...",
  payment: "Processing payment...",
  isoftpull: "Gathering information...",
  accio: "Performing background checks...",
  polling: "Finalizing verification...",
  complete: "Verification complete!",
};

export const ProcessingScreen = ({
  formData,
  onComplete,
  onBack,
  onStepChange,
  onPaymentMethodReady,
  selectedPaymentMethodId,
  shouldStartPayment
}: ProcessingScreenProps): JSX.Element => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("select-payment");
  const [completedSteps, setCompletedSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

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

      const { clientSecret, paymentIntentId } = data;

      if (!clientSecret) {
        throw new Error('No client secret returned from server');
      }

      console.log('✅ Payment intent created, confirming with Stripe...');

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

      // Step 3: Poll for payment status
      const success = await pollPaymentStatus(paymentIntentId);

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

          // For ACH/bank transfers, 'processing' means the payment was initiated successfully
          if (data.status === 'succeeded' || data.status === 'processing') {
            clearInterval(pollInterval);
            console.log('✅ Payment succeeded or processing');
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

  // Submit verification to API
  const submitVerification = async () => {
    try {
      // MOCK MODE - Skip API call entirely
      console.log("🎭 MOCK MODE: Simulating verification submission");

      // Simulate credit check passing
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCompletedSteps(prev => [...prev, "isoftpull"]);

      // Simulate Accio submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCompletedSteps(prev => [...prev, "accio"]);
      setCurrentStep("polling");

      // Simulate background check submission - spin for 2 seconds then show complete step
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCompletedSteps(prev => [...prev, "polling"]);
      setCurrentStep("complete");
      setShowPendingMessage(true);

    } catch (err) {
      console.error("Verification submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit verification");
    }
  };


  const isStepComplete = (step: ProcessingStep) => completedSteps.includes(step);
  const isStepCurrent = (step: ProcessingStep) => currentStep === step;
  const isStepError = error && (step === currentStep);

  return (
    <div className="flex flex-col w-full items-start justify-center gap-4 p-2 md:p-4 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center">
              <HomeIcon className="w-6 h-6" />
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
              : "Processing Your Verification"}
          </h1>

          <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
            {currentStep === "complete"
              ? "Your background check has been completed successfully."
              : currentStep === "select-payment"
              ? "Complete payment to begin your verification process."
              : "Please wait while we process your verification checks."}
          </p>
        </div>

        {/* Payment Selector - Show when on payment selection step */}
        {currentStep === "select-payment" && !isStepComplete("select-payment") && (
              <VerificationPaymentSelector
                formData={formData}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={onBack || (() => window.history.back())}
                onPaymentMethodReady={onPaymentMethodReady}
              />
        )}

        {/* Processing Status - Centered spinner with sliding text */}
        {currentStep !== "select-payment" && (
          <div className="flex flex-col items-center justify-center gap-8 py-12 w-full min-h-[300px]">
              {/* Spinner */}
              {error ? (
                <AlertCircle className="w-16 h-16 text-red-600" />
              ) : currentStep === "complete" ? (
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              ) : (
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
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
                    <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-xl text-center">
                      {error || stepLabels[currentStep]}
                    </h3>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Additional info for complete state */}
              {currentStep === "complete" && (
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm text-center max-w-md">
                  Background check results typically arrive within 24-48 hours, but can take up to 2 weeks. You&apos;ll receive an email when your results are ready.
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

    </div>
  );
};

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
  onPaymentMethodReady?: (canPay: boolean, payFn: () => void) => void;
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

export const ProcessingScreen = ({ formData, onComplete, onBack, onStepChange, onPaymentMethodReady }: ProcessingScreenProps): JSX.Element => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("select-payment");
  const [completedSteps, setCompletedSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  // Handle payment success - called by embedded payment form
  const handlePaymentSuccess = async () => {
    // Mark select-payment step complete, move to payment processing
    setCompletedSteps(prev => [...prev, "select-payment"]);
    setCurrentStep("payment");

    // Wait a moment for webhook to create Purchase record
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mark payment complete, move to credit check
    setCompletedSteps(prev => [...prev, "payment"]);
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

  // Poll for verification status
  const startPolling = () => {
    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await fetch("/api/verification/status");
        const data = await response.json();

        setVerificationStatus(data);
        pollCount++;
        setPollingCount(pollCount);

        // Show "can take weeks" message after 20 polls (~5 minutes)
        if (pollCount >= 20) {
          setShowPendingMessage(true);
        }

        if (data.status === "COMPLETED") {
          clearInterval(pollInterval);
          setCompletedSteps(prev => [...prev, "polling", "complete"]);
          setCurrentStep("complete");
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          setError("Verification failed. Please contact support.");
        }

      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Poll every 15 seconds for first 5 minutes
    pollInterval = setInterval(poll, 15000);
    poll(); // Initial poll

    // After 5 minutes, switch to polling every 60 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      if (currentStep === "polling") {
        pollInterval = setInterval(poll, 60000);
      }
    }, 5 * 60 * 1000);

    // Cleanup on unmount
    return () => clearInterval(pollInterval);
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

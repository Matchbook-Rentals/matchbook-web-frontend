"use client"

import { HomeIcon, CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import React, { useState, useEffect } from "react";
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
}

export type ProcessingStep =
  | "select-payment"
  | "payment"
  | "isoftpull"
  | "accio"
  | "polling"
  | "complete";

const stepLabels: Record<ProcessingStep, string> = {
  "select-payment": "Select Payment Method",
  payment: "Processing Payment",
  isoftpull: "Running Credit Pre-Screen (iSoftPull)",
  accio: "Submitting Background Check (Accio Data)",
  polling: "Waiting for Background Check Results",
  complete: "Verification Complete",
};

export const ProcessingScreen = ({ formData, onComplete, onBack, onStepChange }: ProcessingScreenProps): JSX.Element => {
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

        {/* Processing Steps - Always visible */}
        <Card className="w-full rounded-2xl border border-solid border-[#cfd4dc]">
          <CardContent className="flex flex-col items-start justify-center gap-6 p-8">
            {(["select-payment", "payment", "isoftpull", "accio", "polling", "complete"] as ProcessingStep[]).map((step) => {
                // Skip polling step in UI unless we're actively polling
                if (step === "polling" && currentStep !== "polling" && !isStepComplete("polling")) {
                  return null;
                }

                return (
                  <div key={step} className="flex items-start gap-4 w-full">
                    <div className="flex-shrink-0 mt-1">
                      {isStepError && step === currentStep ? (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      ) : step === "complete" && isStepCurrent(step) ? (
                        <Clock className="w-6 h-6 text-amber-600" />
                      ) : isStepComplete(step) ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : isStepCurrent(step) && step === "select-payment" ? (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      ) : isStepCurrent(step) ? (
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base">
                        {stepLabels[step]}
                      </h3>

                      {step === "select-payment" && !isStepComplete("select-payment") && (
                        <div className="mt-4 w-full">
                          <VerificationPaymentSelector
                            formData={formData}
                            onPaymentSuccess={handlePaymentSuccess}
                            onCancel={onBack || (() => window.history.back())}
                          />
                        </div>
                      )}

                      {step === "select-payment" && isStepComplete("select-payment") && (
                        <p className="[font-family:'Poppins',Helvetica] font-normal text-green-600 text-sm mt-1">
                          Payment method confirmed
                        </p>
                      )}

                      {step === "payment" && (
                        <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm mt-1">
                          {isStepComplete("payment")
                            ? "Payment of $25.00 processed successfully"
                            : "Processing your payment securely..."}
                        </p>
                      )}

                      {step === "isoftpull" && (
                        <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm mt-1">
                          {error && currentStep === "isoftpull"
                            ? error
                            : "Checking credit score to determine eligibility. This helps avoid unnecessary charges."}
                        </p>
                      )}

                      {step === "accio" && (
                        <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm mt-1">
                          Submitting request for comprehensive background check including criminal history and eviction records.
                        </p>
                      )}

                      {step === "polling" && (
                        <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
                          {!showPendingMessage
                            ? "Submitting background check request..."
                            : "Background check submitted successfully. Results typically arrive within 24-48 hours."}
                        </p>
                      )}

                      {step === "complete" && isStepCurrent(step) && (
                        <div className="flex items-start gap-2 mt-1">
                          <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
                            Background check results typically arrive within 24-48 hours, but can take up to 2 weeks. You&apos;ll receive an email when your results are ready.
                            You can now view your credit report and safely leave this page.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </CardContent>
          </Card>

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

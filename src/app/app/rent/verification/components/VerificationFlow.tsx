"use client"

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { BrandButton } from "@/components/ui/brandButton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CurrentAddressSection } from "./sections/CurrentAddressSection";
import { PersonalInformationSection } from "./sections/PersonalInformationSection";
import { AuthorizationDisclosureScreen } from "./AuthorizationDisclosureScreen";
import { ProcessingScreen, type ProcessingStep } from "./ProcessingScreen";
import { VerificationResultsScreen } from "./VerificationResultsScreen";
import { VerificationDetailsScreen } from "./details/VerificationDetailsScreen";
import { VerificationFooter } from "./VerificationFooter";
import { verificationSchema, type VerificationFormValues } from "../utils";

type Step = "personal-info" | "authorization" | "processing" | "results" | "details";

export const VerificationFlow = (): JSX.Element => {
  const [currentStep, setCurrentStep] = useState<Step>("personal-info");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("select-payment");
  const [canPay, setCanPay] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [shouldStartPayment, setShouldStartPayment] = useState(false);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      ssn: "",
      dob: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      fcraRightsAcknowledgment: false,
      creditAuthorizationAcknowledgment: false,
      backgroundCheckAuthorization: false,
    },
  });

  const loadDevData = () => {
    form.setValue("firstName", "John");
    form.setValue("lastName", "Doe");
    form.setValue("ssn", "123456789");
    form.setValue("dob", "1990-01-15");
    form.setValue("address", "123 Main Street");
    form.setValue("city", "San Francisco");
    form.setValue("state", "CA");
    form.setValue("zip", "94102");
    transitionToNextStep();
  };

  const handlePersonalInfoSubmit = async () => {
    // Validate only the personal info fields
    const personalInfoFields = ["firstName", "lastName", "ssn", "dob", "address", "city", "state", "zip"] as const;
    const isValid = await form.trigger(personalInfoFields);

    if (isValid) {
      transitionToNextStep();
    }
  };

  const transitionToNextStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("authorization");
      setIsTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("personal-info");
      setIsTransitioning(false);
    }, 300);
  };

  const handleBackToAuthorization = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("authorization");
      setIsTransitioning(false);
    }, 300);
  };

  const handleFinalSubmit = async () => {
    const authFields = ["fcraRightsAcknowledgment", "creditAuthorizationAcknowledgment", "backgroundCheckAuthorization"] as const;
    const isValid = await form.trigger(authFields);

    if (isValid) {
      const data = form.getValues();
      console.log("Complete verification submitted:", data);
      // Transition to processing screen
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep("processing");
        setIsTransitioning(false);
      }, 300);
    } else {
      // Scroll to bottom to show validation errors
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleProcessingComplete = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("results");
      setIsTransitioning(false);
    }, 300);
  };

  const handleViewDetails = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("details");
      setIsTransitioning(false);
    }, 300);
  };

  const handlePaymentMethodReady = (ready: boolean, paymentMethodId: string | null) => {
    setCanPay(ready);
    setSelectedPaymentMethodId(paymentMethodId);
  };

  const handlePayClick = () => {
    // When Pay $25.00 is clicked, trigger the payment to start
    setShouldStartPayment(true);
    setProcessingStep("payment");
  };

  return (
    <div className="flex flex-col w-full items-start justify-center relative overflow-hidden pb-24">
      <Form {...form}>
        <div
          className={`w-full transition-all duration-300 ease-in-out ${
            isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          }`}
        >
          {currentStep === "personal-info" && (
            <div className="flex flex-col w-full items-start justify-center relative gap-4 p-2 md:p-4">
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

              <div className="flex flex-col w-full items-start gap-1">
                <h1 className="font-text-heading-medium-medium text-[#373940] text-4xl">
                  Complete MatchBook Renter Verification
                </h1>
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
                  This screening includes a credit check, eviction history, and criminal background check
                </p>
              </div>

              <main className="flex flex-col items-start justify-center relative self-stretch w-full flex-[0_0_auto]">
                <CurrentAddressSection form={form} />
              </main>
            </div>
          )}

          {currentStep === "authorization" && (
            <>
              <AuthorizationDisclosureScreen
                form={form}
                onBack={handleBack}
                onSubmit={handleFinalSubmit}
              />
            </>
          )}

          {currentStep === "processing" && (
            <ProcessingScreen
              formData={form.getValues()}
              onComplete={handleProcessingComplete}
              onBack={handleBackToAuthorization}
              onStepChange={setProcessingStep}
              onPaymentMethodReady={handlePaymentMethodReady}
              selectedPaymentMethodId={selectedPaymentMethodId}
              shouldStartPayment={shouldStartPayment}
            />
          )}

          {currentStep === "results" && (
            <VerificationResultsScreen onViewDetails={handleViewDetails} />
          )}

          {currentStep === "details" && (
            <VerificationDetailsScreen />
          )}
        </div>
      </Form>

      {/* Fixed Footer with Context-Dependent Buttons */}
      {currentStep === "personal-info" && (
        <VerificationFooter
          secondaryButton={
            process.env.NODE_ENV === 'development'
              ? {
                  label: "Skip (Dev)",
                  onClick: loadDevData,
                  variant: "outline",
                }
              : undefined
          }
          primaryButton={{
            label: "Continue",
            onClick: handlePersonalInfoSubmit,
          }}
        />
      )}

      {currentStep === "authorization" && (
        <VerificationFooter
          secondaryButton={{
            label: "Back",
            onClick: handleBack,
            variant: "outline",
          }}
          primaryButton={{
            label: "Continue",
            onClick: handleFinalSubmit,
          }}
        />
      )}

      {currentStep === "processing" && (
        <VerificationFooter
          secondaryButton={
            // Only show back button during payment selection
            processingStep === "select-payment"
              ? {
                  label: "Back",
                  onClick: handleBackToAuthorization,
                  variant: "outline",
                }
              : undefined
          }
          primaryButton={{
            label: processingStep === "select-payment" ? "Pay $25.00" : "View Report",
            onClick: processingStep === "select-payment" ? handlePayClick : handleProcessingComplete,
            disabled: processingStep === "select-payment" ? !canPay : processingStep !== "complete",
          }}
        />
      )}

      {currentStep === "results" && (
        <VerificationFooter
          primaryButton={{
            label: "View Details",
            onClick: handleViewDetails,
          }}
        />
      )}
    </div>
  );
};

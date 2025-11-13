"use client"

import { HomeIcon } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { BrandButton } from "@/components/ui/brandButton";
import { CurrentAddressSection } from "./sections/CurrentAddressSection";
import { PersonalInformationSection } from "./sections/PersonalInformationSection";
import { AuthorizationDisclosureScreen } from "./AuthorizationDisclosureScreen";
import { ProcessingScreen } from "./ProcessingScreen";
import { VerificationResultsScreen } from "./VerificationResultsScreen";
import { VerificationDetailsScreen } from "./details/VerificationDetailsScreen";
import { verificationSchema, type VerificationFormValues } from "../utils";

type Step = "personal-info" | "authorization" | "processing" | "results" | "details";

export const FrameScreen = (): JSX.Element => {
  const [currentStep, setCurrentStep] = useState<Step>("personal-info");
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  return (
    <div className="flex flex-col w-full items-start justify-center relative overflow-hidden">
      <Form {...form}>
        <div
          className={`w-full transition-all duration-300 ease-in-out ${
            isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          }`}
        >
          {currentStep === "personal-info" && (
            <div className="flex flex-col w-full items-start justify-center relative">
              <nav className="inline-flex items-center gap-4 relative flex-[0_0_auto] px-4 mb-6">
                <HomeIcon className="w-6 h-6 text-gray-500" />

                <div className="relative w-fit mt-[-1.00px] font-text-md-regular font-[number:var(--text-md-regular-font-weight)] text-gray-500 text-[length:var(--text-md-regular-font-size)] tracking-[var(--text-md-regular-letter-spacing)] leading-[var(--text-md-regular-line-height)] whitespace-nowrap [font-style:var(--text-md-regular-font-style)]">
                  /
                </div>

                <div className="relative w-fit mt-[-1.00px] font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-900 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                  MatchBook Renter Verification
                </div>
              </nav>

              <main className="flex flex-col items-start justify-center relative self-stretch w-full flex-[0_0_auto] gap-6">
                <PersonalInformationSection />
                <CurrentAddressSection form={form} />

                <div className="w-full flex flex-wrap-reverse md:flex-nowrap justify-end md:justify-between gap-3 px-6">
                  {process.env.NODE_ENV === 'development' && (
                    <BrandButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={loadDevData}
                    >
                      Skip (Dev)
                    </BrandButton>
                  )}
                  <div className={process.env.NODE_ENV === 'development' ? '' : 'ml-auto'}>
                    <BrandButton
                      type="button"
                      size="lg"
                      onClick={handlePersonalInfoSubmit}
                    >
                      Continue to Authorization
                    </BrandButton>
                  </div>
                </div>
              </main>
            </div>
          )}

          {currentStep === "authorization" && (
            <AuthorizationDisclosureScreen
              form={form}
              onBack={handleBack}
              onSubmit={handleFinalSubmit}
            />
          )}

          {currentStep === "processing" && (
            <ProcessingScreen
              formData={form.getValues()}
              onComplete={handleProcessingComplete}
              onBack={handleBackToAuthorization}
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
    </div>
  );
};

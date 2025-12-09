"use client"

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { BrandButton } from "@/components/ui/brandButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AuthorizationStepScreen } from "./AuthorizationStepScreen";
import { BackgroundCheckAuthorizationContent } from "./legal/BackgroundCheckAuthorizationContent";
import { CreditCheckAuthorizationContent } from "./legal/CreditCheckAuthorizationContent";
import { ProcessingScreen, type ProcessingStep } from "./ProcessingScreen";
import { VerificationResultsScreen } from "./VerificationResultsScreen";
import { VerificationDetailsScreen } from "./details/VerificationDetailsScreen";
import { VerificationFooter } from "./VerificationFooter";
import { verificationSchema, type VerificationFormValues } from "../utils";
import type { SavedPaymentMethod } from "@/components/stripe/verification-payment-selector";
import type { ISoftPullResponse } from "@/types/isoftpull";

// iSoftPull test clients for development testing
const ISOFTPULL_TEST_CLIENTS = [
  { firstName: "Steve", lastName: "Johnson", credit: "~700 (Good)", ssn: "111111111", dob: "1980-08-15", address: "3557 Lancer Way", city: "Carlsbad", state: "CA", zip: "92008" },
  { firstName: "John", lastName: "Dough", credit: "~600 (Fair)", ssn: "222222222", dob: "1982-04-15", address: "310 Tamarack Ave", city: "Carlsbad", state: "CA", zip: "92010" },
  { firstName: "Susie", lastName: "Que", credit: "~500 (Poor)", ssn: "333333333", dob: "1983-06-15", address: "2270 Camino Vida Roble", city: "Carlsbad", state: "CA", zip: "92011" },
  { firstName: "Chris", lastName: "Iceman", credit: "Frozen", ssn: "444444444", dob: "1982-09-15", address: "3743 Jefferson St", city: "Carlsbad", state: "CA", zip: "92008" },
  { firstName: "Jeff", lastName: "Nascore", credit: "No Score", ssn: "555555555", dob: "1979-10-15", address: "1999 California St", city: "Carlsbad", state: "CA", zip: "92054" },
  { firstName: "Invalid", lastName: "SSN", credit: "Invalid SSN", ssn: "000000000", dob: "1985-01-01", address: "123 Test St", city: "Carlsbad", state: "CA", zip: "92008" },
];

// Accio Data test clients for background check testing
const ACCIO_TEST_CLIENTS = [
  { firstName: "Dante", lastName: "Blackwood", credit: "Eviction Records", ssn: "118829724", dob: "1994-05-13", address: "751 N Indian Creek DR", city: "Clarkston", state: "GA", zip: "30021" },
  { firstName: "Marcus", lastName: "Snell", credit: "Criminal Records", ssn: "123456789", dob: "1983-03-24", address: "123 Any Street", city: "Anytown", state: "GA", zip: "30021" },
];

type Step = "personal-info" | "background-auth" | "credit-auth" | "processing" | "results" | "details";

interface VerificationFlowProps {
  initialPaymentMethods?: SavedPaymentMethod[];
  initialClientSecret?: string | null;
  isAdmin?: boolean;
}

export const VerificationFlow = ({
  initialPaymentMethods,
  initialClientSecret,
  isAdmin = false,
}: VerificationFlowProps): JSX.Element => {
  const [currentStep, setCurrentStep] = useState<Step>("personal-info");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("select-payment");
  const [canPay, setCanPay] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [shouldStartPayment, setShouldStartPayment] = useState(false);
  const [showTestClientModal, setShowTestClientModal] = useState(false);
  const [creditData, setCreditData] = useState<ISoftPullResponse | null>(null);

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
      creditAuthorizationAcknowledgment: false,
      backgroundCheckAuthorization: false,
    },
  });

  const openTestClientModal = () => {
    setShowTestClientModal(true);
  };

  const selectTestClient = (client: typeof ISOFTPULL_TEST_CLIENTS[number]) => {
    form.setValue("firstName", client.firstName);
    form.setValue("lastName", client.lastName);
    form.setValue("ssn", client.ssn);
    form.setValue("dob", client.dob);
    form.setValue("address", client.address);
    form.setValue("city", client.city);
    form.setValue("state", client.state);
    form.setValue("zip", client.zip);
    setShowTestClientModal(false);
    transitionToBackgroundAuth();
  };

  const handlePersonalInfoSubmit = async () => {
    // Validate only the personal info fields
    const personalInfoFields = ["firstName", "lastName", "ssn", "dob", "address", "city", "state", "zip"] as const;
    const isValid = await form.trigger(personalInfoFields);

    if (isValid) {
      transitionToBackgroundAuth();
    }
  };

  const transitionToBackgroundAuth = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("background-auth");
      setIsTransitioning(false);
      scrollToTop();
    }, 300);
  };

  const handleBackToPersonalInfo = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("personal-info");
      setIsTransitioning(false);
    }, 300);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCheckbox = (checkboxId: string) => {
    const element = document.getElementById(checkboxId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleBackgroundAuthSubmit = async () => {
    const isValid = await form.trigger("backgroundCheckAuthorization");

    if (isValid) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep("credit-auth");
        setIsTransitioning(false);
        scrollToTop();
      }, 300);
    } else {
      scrollToCheckbox("background-auth-checkbox");
    }
  };

  const handleBackToBackgroundAuth = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("background-auth");
      setIsTransitioning(false);
    }, 300);
  };

  const handleCreditAuthSubmit = async () => {
    const isValid = await form.trigger("creditAuthorizationAcknowledgment");

    if (isValid) {
      const data = form.getValues();
      console.log("Complete verification submitted:", data);
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep("processing");
        setIsTransitioning(false);
        scrollToTop();
      }, 300);
    } else {
      scrollToCheckbox("credit-auth-checkbox");
    }
  };

  const handleBackToCreditAuth = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("credit-auth");
      setIsTransitioning(false);
    }, 300);
  };

  const handleProcessingComplete = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("results");
      setIsTransitioning(false);
      scrollToTop();
    }, 300);
  };

  const handleViewDetails = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep("details");
      setIsTransitioning(false);
      scrollToTop();
    }, 300);
  };

  const handlePaymentMethodReady = (ready: boolean, paymentMethodId: string | null) => {
    setCanPay(ready);
    setSelectedPaymentMethodId(paymentMethodId);
  };

  const handleCreditDataReceived = (data: ISoftPullResponse) => {
    setCreditData(data);
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

          {currentStep === "background-auth" && (
            <AuthorizationStepScreen
              form={form}
              title="Background Check Authorization"
              checkboxName="backgroundCheckAuthorization"
              checkboxLabel="By checking this box, I authorize Matchbook LLC to conduct a background check and eviction history search."
              checkboxId="background-auth-checkbox"
            >
              <BackgroundCheckAuthorizationContent />
            </AuthorizationStepScreen>
          )}

          {currentStep === "credit-auth" && (
            <AuthorizationStepScreen
              form={form}
              title="Credit Check Authorization"
              checkboxName="creditAuthorizationAcknowledgment"
              checkboxLabel="By checking this box, I authorize Matchbook LLC to obtain my credit report for rental evaluation purposes."
              checkboxId="credit-auth-checkbox"
            >
              <CreditCheckAuthorizationContent />
            </AuthorizationStepScreen>
          )}

          {currentStep === "processing" && (
            <ProcessingScreen
              form={form}
              onComplete={handleProcessingComplete}
              onBack={handleBackToCreditAuth}
              onStepChange={setProcessingStep}
              onPaymentMethodReady={handlePaymentMethodReady}
              onCreditDataReceived={handleCreditDataReceived}
              selectedPaymentMethodId={selectedPaymentMethodId}
              shouldStartPayment={shouldStartPayment}
              initialPaymentMethods={initialPaymentMethods}
              initialClientSecret={initialClientSecret}
            />
          )}

          {currentStep === "results" && (
            <VerificationResultsScreen
              onViewDetails={handleViewDetails}
              creditData={creditData}
            />
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
            isAdmin
              ? {
                  label: "Skip (Dev)",
                  onClick: openTestClientModal,
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

      {currentStep === "background-auth" && (
        <VerificationFooter
          secondaryButton={{
            label: "Back",
            onClick: handleBackToPersonalInfo,
            variant: "outline",
          }}
          primaryButton={{
            label: "Continue",
            onClick: handleBackgroundAuthSubmit,
          }}
        />
      )}

      {currentStep === "credit-auth" && (
        <VerificationFooter
          secondaryButton={{
            label: "Back",
            onClick: handleBackToBackgroundAuth,
            variant: "outline",
          }}
          primaryButton={{
            label: "Continue",
            onClick: handleCreditAuthSubmit,
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
                  onClick: handleBackToCreditAuth,
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

      {/* Test Client Selector Modal (Dev Only) */}
      <Dialog open={showTestClientModal} onOpenChange={setShowTestClientModal}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto" xOnRight>
          <DialogHeader>
            <DialogTitle>Select Test Client</DialogTitle>
            <DialogDescription>
              Choose a test applicant to auto-fill the form
            </DialogDescription>
          </DialogHeader>

          {/* iSoftPull Test Clients */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">iSoftPull (Credit Check)</h3>
            <div className="flex flex-col gap-2">
              {ISOFTPULL_TEST_CLIENTS.map((client) => (
                <button
                  key={client.ssn}
                  onClick={() => selectTestClient(client)}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      SSN: {client.ssn}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {client.credit}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Accio Data Test Clients */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Accio Data (Background Check)</h3>
            <div className="flex flex-col gap-2">
              {ACCIO_TEST_CLIENTS.map((client) => (
                <button
                  key={`accio-${client.ssn}`}
                  onClick={() => selectTestClient(client)}
                  className="flex items-center justify-between p-3 rounded-lg border border-orange-200 hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      SSN: {client.ssn}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    {client.credit}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

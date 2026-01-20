"use client";

import React, { useEffect, useState } from "react";
import { Check, Square } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { isIdentityVerified } from "@/lib/verification-utils";
import { loadStripe } from '@stripe/stripe-js';
import { createStripeVerificationSession } from '@/app/actions/stripe-identity';
import { useRouter } from "next/navigation";
import BrandModal from "@/components/BrandModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrandButton } from "@/components/ui/brandButton";
import { agreeToHostTerms } from "@/app/actions/user";

export interface HostUserData {
  id: string;
  stripeAccountId: string | null;
  agreedToHostTerms: Date | null;
  stripeChargesEnabled: boolean | null;
  stripePayoutsEnabled: boolean | null;
  stripeDetailsSubmitted: boolean | null;
  medallionIdentityVerified: boolean | null;
  medallionVerificationStatus: string | null;
  stripeVerificationStatus: string | null;
}

export interface OnboardingChecklistCardProps {
  hostUserData: HostUserData | null;
  isAdminDev: boolean;
  title?: string;
  description?: string;
  hideHeader?: boolean;
}

const FCRA_CONTENT_ENDPOINT = "/api/legal/fcra";

// Utility function to check if host onboarding is complete
export function isHostOnboardingComplete(hostUserData: HostUserData | null): boolean {
  if (!hostUserData) return false;

  const hasStripeAccount = !!hostUserData.stripeAccountId;
  const stripeComplete = hostUserData.stripeChargesEnabled && hostUserData.stripeDetailsSubmitted;
  const identityVerified = isIdentityVerified(hostUserData);
  const fcraAcknowledged = !!hostUserData.agreedToHostTerms;

  return hasStripeAccount && stripeComplete && identityVerified && fcraAcknowledged;
}

export const OnboardingChecklistCard = ({
  hostUserData,
  isAdminDev,
  title = "Onboarding Checklist",
  description,
  hideHeader = false
}: OnboardingChecklistCardProps): JSX.Element => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCompletingAuth, setIsCompletingAuth] = useState(false);
  const [isCompletingStripeAuth, setIsCompletingStripeAuth] = useState(false);
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [identityVerificationError, setIdentityVerificationError] = useState<string | null>(null);
  const [isFcraModalOpen, setIsFcraModalOpen] = useState(false);
  const [fcraContent, setFcraContent] = useState<string | null>(null);
  const [isLoadingFcraContent, setIsLoadingFcraContent] = useState(false);
  const [fcraLoadError, setFcraLoadError] = useState<string | null>(null);
  const [isAcknowledgingFcra, setIsAcknowledgingFcra] = useState(false);

  useEffect(() => {
    if (!isFcraModalOpen || fcraContent) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchFcraContent = async () => {
      try {
        setIsLoadingFcraContent(true);
        setFcraLoadError(null);

        const response = await fetch(FCRA_CONTENT_ENDPOINT, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Failed to load FCRA content (${response.status})`);
        }

        const data = await response.json();
        const html = data?.content;

        if (!html) {
          throw new Error("No FCRA content returned from server");
        }

        if (isMounted) {
          setFcraContent(html);
        }
      } catch (error) {
        const err = error as Error;
        if (err?.name === "AbortError") {
          return;
        }

        console.error("Error loading FCRA content:", error);
        if (isMounted) {
          setFcraLoadError("Unable to load FCRA content. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingFcraContent(false);
        }
      }
    };

    fetchFcraContent();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isFcraModalOpen, fcraContent]);

  const handleStripeSetup = async () => {
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/create-and-onboard', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Error getting Stripe URL:', data.error);

        // Show user-friendly error message
        let errorMessage = 'Failed to set up Stripe account. ';

        if (data.errorCode === 'USER_NOT_FOUND') {
          errorMessage += 'Your user account was not found. Please contact support.';
        } else if (data.errorCode === 'EMAIL_REQUIRED') {
          errorMessage += 'An email address is required. Please update your profile.';
        } else {
          errorMessage += data.error || 'Please try again or contact support.';
        }

        alert(errorMessage);
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Error setting up Stripe:', error);
      alert('An unexpected error occurred while setting up your Stripe account. Please try again or contact support.');
      setIsRedirecting(false);
    }
  };

  const handleTestMedallionAuthComplete = async () => {
    setIsCompletingAuth(true);
    try {
      const response = await fetch('/api/admin/medallion/complete-test-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        // Reload page to show updated status
        window.location.reload();
      } else {
        console.error('Error completing test Medallion authentication:', data.error);
        setIsCompletingAuth(false);
      }
    } catch (error) {
      console.error('Error completing test Medallion authentication:', error);
      setIsCompletingAuth(false);
    }
  };

  const handleTestStripeAuthComplete = async () => {
    setIsCompletingStripeAuth(true);
    try {
      const response = await fetch('/api/admin/stripe-identity/complete-test-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        // Reload page to show updated status
        window.location.reload();
      } else {
        console.error('Error completing test Stripe authentication:', data.error);
        setIsCompletingStripeAuth(false);
      }
    } catch (error) {
      console.error('Error completing test Stripe authentication:', error);
      setIsCompletingStripeAuth(false);
    }
  };

  const handleIdentityVerificationClick = async () => {
    setIsVerifyingIdentity(true);
    setIdentityVerificationError(null);

    try {
      console.log('🔐 Starting Stripe Identity verification...');

      // Get the verification session from our backend
      const result = await createStripeVerificationSession();

      if (!result.success || !result.clientSecret) {
        console.error('❌ Failed to create verification session:', result.error);
        setIdentityVerificationError('An error occurred. Please try again later.');
        setIsVerifyingIdentity(false);
        return;
      }

      console.log('✅ Verification session created:', result.sessionId);

      // Load Stripe.js
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

      if (!stripe) {
        console.error('❌ Failed to load Stripe.js');
        setIdentityVerificationError('An error occurred. Please try again later.');
        setIsVerifyingIdentity(false);
        return;
      }

      console.log('🎨 Opening Stripe Identity verification modal...');

      // Open the verification modal
      // Note: Stripe handles all verification UI/UX internally (errors, retries, etc.)
      // The modal will show appropriate messages for:
      // - Document upload failures
      // - Expired documents
      // - Selfie mismatches
      // - Any other verification issues
      const { error: sdkError } = await stripe.verifyIdentity(result.clientSecret);

      // Only SDK/technical errors are returned here, not verification failures
      // Verification results come via webhooks and polling
      if (sdkError) {
        console.error('❌ Stripe SDK error:', sdkError);
        setIdentityVerificationError('An error occurred. Please try again later.');
        setIsVerifyingIdentity(false);
        return;
      }

      console.log('✅ Verification modal closed');

      // Modal closed - user either completed, failed, or cancelled
      // We don't know which yet - that info comes from Stripe via webhooks/polling

      // Give webhooks a brief moment to fire (they're usually instant but can be delayed)
      // Then refresh to fetch latest verification status from Stripe
      console.log('🔄 Waiting briefly for webhook, then refreshing...');

      // Wait 1 second to give webhook time to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh the RSC - this will trigger polling if status hasn't updated yet
      router.refresh();

      // Reset loading state after refresh
      setIsVerifyingIdentity(false);
    } catch (err) {
      console.error('❌ Unexpected error during verification:', err);
      setIdentityVerificationError('An error occurred. Please try again later.');
      setIsVerifyingIdentity(false);
    }
  };

  const handleOpenFcraModal = () => {
    setIsFcraModalOpen(true);
  };

  const handleFcraAcknowledge = async () => {
    setIsAcknowledgingFcra(true);
    try {
      const formData = new FormData();
      const redirectUrl = typeof window !== "undefined" ? window.location.href : "/app/host/dashboard/overview";
      formData.append("redirect_url", redirectUrl);

      const result = await agreeToHostTerms(formData);

      if (!result?.success) {
        throw new Error("Failed to acknowledge FCRA compliance");
      }

      setIsFcraModalOpen(false);

      // Refresh checklist state to show completion
      router.refresh();
    } catch (error) {
      console.error("Error acknowledging FCRA compliance:", error);
      alert("We couldn't save your FCRA acknowledgment. Please try again.");
    } finally {
      setIsAcknowledgingFcra(false);
    }
  };

  // Check if Stripe account exists but is incomplete
  const hasStripeAccount = !!hostUserData?.stripeAccountId;
  const stripeAccountComplete = hostUserData?.stripeChargesEnabled && hostUserData?.stripeDetailsSubmitted;
  const stripeAccountIncomplete = hasStripeAccount && !stripeAccountComplete;
  const fcraAcknowledged = !!hostUserData?.agreedToHostTerms;

  // Real items with actual completion status
  // See docs/host-onboarding-requirements.md for detailed requirements documentation
  const requiredItems = [
    {
      id: 1,
      text: stripeAccountIncomplete ? "Finish creating your Stripe Account" : "Set up Stripe Account",
      completed: hasStripeAccount && stripeAccountComplete,
    },
    {
      id: 2,
      text: "Complete Identity Verification",
      completed: isIdentityVerified(hostUserData),
    },
    {
      id: 3,
      text: "Acknowledge FCRA Compliance",
      completed: fcraAcknowledged,
    },
  ];

  // Test items for admin_dev - always incomplete
  const testRequiredItems = [
    {
      id: 1,
      text: "Set up Stripe Account (test)",
      completed: false,
    },
    {
      id: 2,
      text: "Force Medallion Verification (test)",
      completed: false,
    },
    {
      id: 3,
      text: "Force Stripe Verification (test)",
      completed: false,
    },
  ];

  const renderChecklist = (items: typeof requiredItems, checklistTitle: string, hideTitle: boolean = false) => (
    <Card className="flex flex-col items-end gap-[18px] p-6 relative bg-white rounded-xl">
      <CardContent className="p-0 w-full">
        {!hideTitle && (
          <>
            <div className="flex items-center justify-end gap-8 relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-neutralneutral-900 text-xl tracking-[0] leading-[normal]">
                {checklistTitle}
              </div>
            </div>

            {description && (
              <div className="mt-3 mb-4">
                <p className="text-sm text-gray-600 font-normal leading-[21px] font-['Poppins',Helvetica]">
                  {description}
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto] mt-[18px]">
          <div className="flex flex-col items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-center justify-end gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative flex-1 mt-[-1.00px] font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-neutralneutral-700 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                Required
              </div>
            </div>

            {items.map((item) => {
              const isStripeItem = item.text.includes("Stripe Account");
              const isIdentityVerificationItem = item.text.includes("Identity Verification");
              const isFcraComplianceItem = item.text.includes("FCRA Compliance");
              const isTestMedallionItem = item.text.includes("Force Medallion Verification");
              const isTestStripeItem = item.text.includes("Force Stripe Verification");
              const shouldBeStripeClickable = !item.completed && isStripeItem && !isTestMedallionItem && !isTestStripeItem;
              const shouldBeIdentityVerificationClickable = !item.completed && isIdentityVerificationItem && !isTestMedallionItem && !isTestStripeItem;
              const shouldBeFcraClickable = !item.completed && isFcraComplianceItem;
              const shouldBeTestMedallionClickable = !item.completed && isTestMedallionItem;
              const shouldBeTestStripeClickable = !item.completed && isTestStripeItem;
              const showIdentityError = isIdentityVerificationItem && identityVerificationError;

              return (
                <React.Fragment key={item.id}>
                  <div className="flex items-center justify-end gap-2 relative self-stretch w-full flex-[0_0_auto]">
                    {item.completed ? (
                      <Check className="relative w-6 h-6 text-green-600" />
                    ) : (
                      <Square className="relative w-6 h-6 text-gray-400" />
                    )}

                    <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-neutralneutral-700 text-base tracking-[0] leading-4">
                      {shouldBeStripeClickable ? (
                        <button
                          onClick={handleStripeSetup}
                          disabled={isRedirecting}
                          className="text-left hover:underline cursor-pointer font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)] disabled:opacity-50"
                        >
                          {isRedirecting ? 'Redirecting to Stripe...' : item.text}
                        </button>
                      ) : shouldBeIdentityVerificationClickable ? (
                        <button
                          onClick={handleIdentityVerificationClick}
                          disabled={isVerifyingIdentity}
                          className="text-left hover:underline cursor-pointer font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)] disabled:opacity-50"
                        >
                          {isVerifyingIdentity ? 'Opening verification...' : item.text}
                        </button>
                      ) : shouldBeFcraClickable ? (
                        <button
                          onClick={handleOpenFcraModal}
                          className="text-left hover:underline cursor-pointer font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)]"
                        >
                          {item.text}
                        </button>
                      ) : shouldBeTestMedallionClickable ? (
                        <button
                          onClick={handleTestMedallionAuthComplete}
                          disabled={isCompletingAuth}
                          className="text-left hover:underline cursor-pointer font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)] disabled:opacity-50"
                        >
                          {isCompletingAuth ? 'Setting Medallion Verified...' : item.text}
                        </button>
                      ) : shouldBeTestStripeClickable ? (
                        <button
                          onClick={handleTestStripeAuthComplete}
                          disabled={isCompletingStripeAuth}
                          className="text-left hover:underline cursor-pointer font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)] disabled:opacity-50"
                        >
                          {isCompletingStripeAuth ? 'Setting Stripe Verified...' : item.text}
                        </button>
                      ) : (
                        <span className={`${item.completed ? '' : 'hover:underline cursor-pointer'} font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)]`}>
                          {item.text}
                        </span>
                      )}
                    </div>
                  </div>
                  {showIdentityError && (
                    <div className="ml-8 mt-1 text-sm text-red-600">
                      {identityVerificationError}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const fcraDialog = (
    <BrandModal
      isOpen={isFcraModalOpen}
      onOpenChange={setIsFcraModalOpen}
      className="w-full md:max-w-3xl"
      heightStyle="!top-[5vh] md:!top-[20vh]"
    >
      <div className="flex flex-col gap-4 p-0 md:py-3 md:px-6">
        <div className="border rounded-md h-[80dvh] md:h-[65vh] overflow-hidden bg-white">
          <ScrollArea className="h-full">
            <div className="px-4 py-3">
              {isLoadingFcraContent && (
                <p className="text-sm text-gray-500">Loading FCRA content...</p>
              )}
              {fcraLoadError && !isLoadingFcraContent && (
                <p className="text-sm text-red-600">{fcraLoadError}</p>
              )}
              {fcraContent && !isLoadingFcraContent && !fcraLoadError && (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: fcraContent }}
                />
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center justify-end gap-3">
          <BrandButton
            variant="outline"
            onClick={() => setIsFcraModalOpen(false)}
            disabled={isAcknowledgingFcra}
          >
            Cancel
          </BrandButton>
          <BrandButton
            onClick={handleFcraAcknowledge}
            disabled={isAcknowledgingFcra || isLoadingFcraContent || !!fcraLoadError}
            isLoading={isAcknowledgingFcra}
          >
            {isAcknowledgingFcra ? "Saving..." : "Agree"}
          </BrandButton>
        </div>
      </div>
    </BrandModal>
  );

  // For admin_dev users, show both the real version and test version
  if (isAdminDev) {
    return (
      <>
        <div className="flex flex-col gap-4">
          {renderChecklist(requiredItems, title, hideHeader)}
          {renderChecklist(testRequiredItems, `${title} (Test)`, hideHeader)}
        </div>
        {fcraDialog}
      </>
    );
  }

  // For regular users, just show the real version
  return (
    <>
      {renderChecklist(requiredItems, title, hideHeader)}
      {fcraDialog}
    </>
  );
};

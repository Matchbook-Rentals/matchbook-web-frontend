"use client";

import React, { useState } from "react";
import { Check, Square } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export interface HostUserData {
  id: string;
  stripeAccountId: string | null;
  agreedToHostTerms: Date | null;
  stripeChargesEnabled: boolean | null;
  stripePayoutsEnabled: boolean | null;
  stripeDetailsSubmitted: boolean | null;
  medallionIdentityVerified: boolean | null;
  medallionVerificationStatus: string | null;
}

export interface OnboardingChecklistCardProps {
  hostUserData: HostUserData | null;
  isAdminDev: boolean;
  title?: string;
  description?: string;
  hideHeader?: boolean;
}

// Utility function to check if host onboarding is complete
export function isHostOnboardingComplete(hostUserData: HostUserData | null): boolean {
  if (!hostUserData) return false;

  const hasStripeAccount = !!hostUserData.stripeAccountId;
  const stripeComplete = hostUserData.stripeChargesEnabled && hostUserData.stripeDetailsSubmitted;
  const identityVerified = !!hostUserData.medallionIdentityVerified;

  return hasStripeAccount && stripeComplete && identityVerified;
}

export const OnboardingChecklistCard = ({
  hostUserData,
  isAdminDev,
  title = "Onboarding Checklist",
  description,
  hideHeader = false
}: OnboardingChecklistCardProps): JSX.Element => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCompletingAuth, setIsCompletingAuth] = useState(false);

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

  const handleTestAuthComplete = async () => {
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
        console.error('Error completing test authentication:', data.error);
        setIsCompletingAuth(false);
      }
    } catch (error) {
      console.error('Error completing test authentication:', error);
      setIsCompletingAuth(false);
    }
  };

  // Check if Stripe account exists but is incomplete
  const hasStripeAccount = !!hostUserData?.stripeAccountId;
  const stripeAccountComplete = hostUserData?.stripeChargesEnabled && hostUserData?.stripeDetailsSubmitted;
  const stripeAccountIncomplete = hasStripeAccount && !stripeAccountComplete;

  // Real items with actual completion status
  // See host-onboarding-requirements.md for detailed requirements documentation
  const requiredItems = [
    {
      id: 1,
      text: stripeAccountIncomplete ? "Finish creating your Stripe Account" : "Set up Stripe Account",
      completed: hasStripeAccount && stripeAccountComplete,
    },
    {
      id: 2,
      text: "Complete Identity Verification",
      completed: !!hostUserData?.medallionIdentityVerified,
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
      text: "Complete Identity Verification (test)",
      completed: false,
    },
    {
      id: 3,
      text: "Complete Authentication (test)",
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
              const isTestAuthItem = item.text.includes("Complete Authentication (test)");
              const isTestIdentityItem = item.text.includes("Identity Verification (test)");
              const shouldBeStripeClickable = !item.completed && isStripeItem;
              const shouldBeIdentityVerificationClickable = !item.completed && isIdentityVerificationItem && !isTestIdentityItem;
              const shouldBeTestAuthClickable = !item.completed && isTestAuthItem;
              const shouldBeTestIdentityClickable = !item.completed && isTestIdentityItem;

              const handleIdentityVerificationClick = () => {
                // Navigate to identity verification page
                const currentUrl = window.location.pathname + window.location.search;
                const verificationUrl = `/app/host/onboarding/identity-verification?redirect_url=${encodeURIComponent(currentUrl)}`;
                window.location.href = verificationUrl;
              };
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-end gap-2 relative self-stretch w-full flex-[0_0_auto]"
                >
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
                        className="text-left hover:underline cursor-pointer font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)]"
                      >
                        {item.text}
                      </button>
                    ) : shouldBeTestAuthClickable ? (
                      <button
                        onClick={handleTestAuthComplete}
                        disabled={isCompletingAuth}
                        className="text-left hover:underline cursor-pointer font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)] disabled:opacity-50"
                      >
                        {isCompletingAuth ? 'Completing Authentication...' : item.text}
                      </button>
                    ) : shouldBeTestIdentityClickable ? (
                      <button
                        onClick={handleTestAuthComplete}
                        disabled={isCompletingAuth}
                        className="text-left hover:underline cursor-pointer font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)] disabled:opacity-50"
                      >
                        {isCompletingAuth ? 'Setting Identity Verified...' : item.text}
                      </button>
                    ) : (
                      <span className={`${item.completed ? '' : 'hover:underline cursor-pointer'} font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)]`}>
                        {item.text}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // For admin_dev users, show both the real version and test version
  if (isAdminDev) {
    return (
      <div className="flex flex-col gap-4">
        {renderChecklist(requiredItems, title, hideHeader)}
        {renderChecklist(testRequiredItems, `${title} (Test)`, hideHeader)}
      </div>
    );
  }

  // For regular users, just show the real version
  return renderChecklist(requiredItems, title, hideHeader);
};
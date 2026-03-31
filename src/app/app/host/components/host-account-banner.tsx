"use client";

import React, { useState } from "react";
import { AlertTriangle, XCircle, X } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brandButton";
import { getHostAccountIssues } from "@/lib/verification-utils";
import type { HostUserData } from "./onboarding-checklist-card";

const REQUIREMENT_LABELS: Record<string, string> = {
  'individual.verification.document': 'Identity document',
  'business_profile.url': 'Business website URL',
  'business_profile.mcc': 'Business category',
  'external_account': 'Bank account for payouts',
  'tos_acceptance.date': 'Terms of Service acceptance',
  'individual.address.city': 'Address - city',
  'individual.address.line1': 'Address - street',
  'individual.address.postal_code': 'Address - postal code',
  'individual.address.state': 'Address - state',
  'individual.dob.day': 'Date of birth',
  'individual.dob.month': 'Date of birth',
  'individual.dob.year': 'Date of birth',
  'individual.ssn_last_4': 'Last 4 digits of SSN',
};

/** Deduplicate requirements that map to the same label (e.g. dob.day/month/year → "Date of birth") */
function dedupeRequirements(reqs: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const req of reqs) {
    const label = REQUIREMENT_LABELS[req] || req;
    if (!seen.has(label)) {
      seen.add(label);
      result.push(req);
    }
  }
  return result;
}

function formatRequirement(req: string): string {
  return REQUIREMENT_LABELS[req] || req.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface HostAccountBannerProps {
  hostUserData: HostUserData;
}

export function HostAccountBanner({ hostUserData }: HostAccountBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const issues = getHostAccountIssues(hostUserData);

  if (dismissed || issues.severity === 'none') return null;

  const isWarning = issues.severity === 'warning';
  const Icon = isWarning ? AlertTriangle : XCircle;
  const iconColor = isWarning ? 'text-yellow-600' : 'text-red-600';

  const allRequirements = dedupeRequirements([
    ...(issues.requirementsDue?.past_due || []),
    ...(issues.requirementsDue?.currently_due || []),
  ]);

  const handleFixAccount = async () => {
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/create-and-onboard', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Error getting Stripe URL:', data.error);
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Error getting Stripe account link:', error);
      setIsRedirecting(false);
    }
  };

  return (
    <Card className="flex flex-col items-end gap-[18px] p-6 relative bg-white rounded-xl">
      <CardContent className="p-0 w-full">
        <div className="flex items-start justify-between gap-2 relative self-stretch w-full">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-neutralneutral-900 text-xl tracking-[0] leading-[normal]">
              {isWarning ? 'Action Needed' : 'Account Restricted'}
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 mb-4">
          <p className="text-sm text-gray-600 font-normal leading-[21px] font-['Poppins',Helvetica]">
            {isWarning
              ? 'Your Stripe account needs attention. Please update your information to keep your account in good standing.'
              : 'Your Stripe account is restricted and you cannot accept payments. Please resolve the issues below to continue hosting.'}
          </p>
        </div>

        {(issues.disabledReason || allRequirements.length > 0) && (
          <div className="flex flex-col items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
              {issues.disabledReason && (
                <div className="flex items-center gap-2 relative self-stretch w-full">
                  <div className="relative flex-1 mt-[-1.00px] font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-neutralneutral-700 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                    Reason: {issues.disabledReason.replace(/_/g, ' ')}
                  </div>
                </div>
              )}

              {allRequirements.length > 0 && (
                <>
                  <div className="flex items-center gap-2 relative self-stretch w-full">
                    <div className="relative flex-1 mt-[-1.00px] font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-neutralneutral-700 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                      Missing requirements
                    </div>
                  </div>
                  {allRequirements.slice(0, 5).map((req) => (
                    <div key={req} className="flex items-center gap-2 pl-2 relative self-stretch w-full">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="font-text-label-medium-regular [font-style:var(--text-label-medium-regular-font-style)] font-[number:var(--text-label-medium-regular-font-weight)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] text-[length:var(--text-label-medium-regular-font-size)] text-neutralneutral-700">
                        {formatRequirement(req)}
                      </span>
                    </div>
                  ))}
                  {allRequirements.length > 5 && (
                    <div className="pl-8 text-sm text-gray-500">
                      and {allRequirements.length - 5} more...
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <BrandButton
            onClick={handleFixAccount}
            disabled={isRedirecting}
            isLoading={isRedirecting}
            size="sm"
          >
            {isRedirecting ? 'Redirecting to Stripe...' : 'Go to Stripe'}
          </BrandButton>
        </div>
      </CardContent>
    </Card>
  );
}

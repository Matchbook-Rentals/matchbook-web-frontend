"use client";

import React, { useState } from "react";
import { AlertTriangle, XCircle, X } from "lucide-react";
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
  'individual.ssn_last_4': 'SSN last 4 digits',
};

function formatRequirement(req: string): string {
  return REQUIREMENT_LABELS[req] || req.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface HostAccountBannerProps {
  hostUserData: HostUserData;
}

export function HostAccountBanner({ hostUserData }: HostAccountBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const issues = getHostAccountIssues(hostUserData);

  if (dismissed || issues.severity === 'none') return null;

  const isWarning = issues.severity === 'warning';
  const bgColor = isWarning ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300';
  const textColor = isWarning ? 'text-yellow-800' : 'text-red-800';
  const Icon = isWarning ? AlertTriangle : XCircle;

  const allRequirements = [
    ...(issues.requirementsDue?.past_due || []),
    ...(issues.requirementsDue?.currently_due || []),
  ];

  const handleFixAccount = async () => {
    try {
      const response = await fetch('/api/stripe/create-and-onboard', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error getting Stripe account link:', error);
    }
  };

  return (
    <div className={`border rounded-lg p-4 mx-4 mt-4 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${textColor}`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor}`}>
            {isWarning
              ? 'Action needed \u2014 update your Stripe account'
              : 'Your account is restricted \u2014 you cannot accept payments'}
          </h3>
          {issues.disabledReason && (
            <p className={`text-sm mt-1 ${textColor} opacity-80`}>
              Reason: {issues.disabledReason.replace(/_/g, ' ')}
            </p>
          )}
          {allRequirements.length > 0 && (
            <ul className={`text-sm mt-2 list-disc list-inside ${textColor} opacity-80`}>
              {allRequirements.slice(0, 5).map((req) => (
                <li key={req}>{formatRequirement(req)}</li>
              ))}
              {allRequirements.length > 5 && (
                <li>and {allRequirements.length - 5} more...</li>
              )}
            </ul>
          )}
          <BrandButton
            onClick={handleFixAccount}
            variant={isWarning ? 'outline' : 'default'}
            className="mt-3"
            size="sm"
          >
            Fix Account
          </BrandButton>
        </div>
        <button onClick={() => setDismissed(true)} className={`${textColor} opacity-60 hover:opacity-100`}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

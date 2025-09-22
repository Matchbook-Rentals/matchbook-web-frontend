"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, AlertCircle, Loader2, ExternalLink } from "lucide-react";

export interface MedallionVerificationProps {
  userEmail: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string; // Date of birth in DD-MM-YYYY format
  onVerificationComplete?: (result: any) => void;
  onVerificationError?: (error: any) => void;
}

export const MedallionVerification: React.FC<MedallionVerificationProps> = ({
  userEmail,
  firstName,
  middleName,
  lastName,
  dob,
  onVerificationComplete,
  onVerificationError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerification = async () => {
    // Validate required fields
    if (!firstName || !lastName || !dob) {
      setErrorMessage('Missing required information: first name, last name, and date of birth are required.');
      setVerificationStatus('error');
      return;
    }

    setIsLoading(true);
    setVerificationStatus('verifying');
    setErrorMessage(null);

    console.log('🚀 Starting Medallion verification using JWT API approach');
    console.log('📧 Email:', userEmail);
    console.log('👤 Name:', firstName, lastName);
    console.log('📅 DOB:', dob);

    try {
      // Generate JWT token for Medallion verification
      const jwtResponse = await fetch('/api/medallion/generate-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!jwtResponse.ok) {
        const errorData = await jwtResponse.json();
        throw new Error(errorData.error || 'Failed to generate verification link');
      }

      const jwtData = await jwtResponse.json();
      console.log('✅ JWT generated successfully, redirecting to Medallion');

      // Redirect to Medallion verification page
      window.location.href = jwtData.verificationUrl;

    } catch (error) {
      console.error('❌ Error generating verification link:', error);
      setIsLoading(false);
      setVerificationStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
      onVerificationError?.(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Identity Verification
        </CardTitle>
        <CardDescription>
          Complete your identity verification to continue with host onboarding.
          This process includes photo ID verification and facial recognition.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationStatus === 'completed' ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Verification Complete</p>
              <p className="text-sm text-green-600">Your identity has been successfully verified.</p>
            </div>
          </div>
        ) : verificationStatus === 'error' ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Verification Failed</p>
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <h4 className="font-medium">What you&apos;ll need:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Government-issued photo ID (driver&apos;s license, passport, etc.)</li>
            <li>• Camera or smartphone for document capture</li>
            <li>• Good lighting for clear photos</li>
            <li>• A few minutes to complete the process</li>
          </ul>
        </div>

        <Button
          onClick={handleVerification}
          disabled={isLoading || verificationStatus === 'completed' || !firstName || !lastName || !dob}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating verification link...
            </>
          ) : !firstName || !lastName || !dob ? (
            'Missing required information'
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Begin Identity Verification
            </>
          )}
        </Button>

        <div className="text-xs text-blue-700 p-3 bg-blue-50 border border-blue-200 rounded">
          <strong>Secure API-Based Integration:</strong>
          <div className="mt-1 space-y-1">
            <div>• Your verification account is created via Authenticate.com API</div>
            <div>• Uses secure JWT tokens with CSRF protection</div>
            <div>• Real-time status updates via webhooks and polling</div>
            <div>• Complete verification and return here automatically</div>
            <div>• Retry mechanism for failed verifications</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedallionVerification;
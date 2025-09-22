"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, AlertCircle, Loader2, ExternalLink } from "lucide-react";

// Extend window interface to include Medallion's identify function
declare global {
  interface Window {
    identify?: (
      sdkKey: string,
      userData: {
        email: string;
        firstName: string;
        middleName?: string;
        lastName: string;
        dob: string;
        preferredWorkflowID?: string;
        redirectURL: string;
      },
      errorCallback?: (error: { message: string }) => void
    ) => void;
  }
}

export interface MedallionVerificationSDKProps {
  userEmail: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string; // Date of birth in DD-MM-YYYY format
  onVerificationComplete?: (result: any) => void;
  onVerificationError?: (error: any) => void;
}

export const MedallionVerificationSDK: React.FC<MedallionVerificationSDKProps> = ({
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
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const handleVerification = async () => {
    // Validate required fields
    if (!firstName || !lastName || !dob) {
      setErrorMessage('Missing required information: first name, last name, and date of birth are required.');
      setVerificationStatus('error');
      return;
    }

    if (!sdkLoaded) {
      setErrorMessage('Medallion SDK is still loading. Please wait a moment and try again.');
      setVerificationStatus('error');
      return;
    }

    if (!window.identify) {
      setErrorMessage('Medallion SDK failed to load. Please refresh the page and try again.');
      setVerificationStatus('error');
      return;
    }

    setIsLoading(true);
    setVerificationStatus('verifying');
    setErrorMessage(null);

    console.log('🚀 Starting Medallion verification using LOW_CODE_SDK approach');
    console.log('📧 Email:', userEmail);
    console.log('👤 Name:', firstName, lastName);
    console.log('📅 DOB:', dob);

    try {
      // First, track this verification session on our backend
      const sessionResponse = await fetch('/api/medallion/track-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          firstName,
          lastName,
          dob,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to initialize verification session');
      }

      const sessionData = await sessionResponse.json();
      console.log('✅ Session tracked successfully');

      const sdkKey = process.env.NEXT_PUBLIC_MEDALLION_LOW_CODE_SDK_KEY;
      if (!sdkKey) {
        throw new Error('Medallion SDK key not configured');
      }

      // Prepare redirect URL with session tracking
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const redirectURL = `${baseUrl}/app/host/onboarding/identity-verification?completed=true&session_id=${sessionData.sessionToken}`;

      // Call Medallion's identify function
      window.identify(
        sdkKey,
        {
          email: userEmail,
          firstName,
          middleName: middleName || '',
          lastName,
          dob,
          redirectURL,
        },
        (error) => {
          // Error callback for SDK initialization issues
          console.error('❌ Medallion SDK error:', error);
          setIsLoading(false);
          setVerificationStatus('error');
          setErrorMessage(error.message || 'Failed to initialize verification');
          onVerificationError?.(error);
        }
      );

      // If we reach this point, the SDK call was successful and user should be redirected
      console.log('✅ Medallion SDK initiated successfully, user will be redirected');

    } catch (error) {
      console.error('❌ Error initializing verification:', error);
      setIsLoading(false);
      setVerificationStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
      onVerificationError?.(error);
    }
  };

  return (
    <>
      {/* Load Medallion SDK */}
      <Script
        src="https://cdn.authenticating.com/public/verifyUI/client.js"
        onLoad={() => {
          console.log('✅ Medallion SDK loaded successfully');
          setSdkLoaded(true);
        }}
        onError={() => {
          console.error('❌ Failed to load Medallion SDK');
          setErrorMessage('Failed to load verification system. Please refresh the page and try again.');
          setVerificationStatus('error');
        }}
      />

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
            disabled={isLoading || verificationStatus === 'completed' || !firstName || !lastName || !dob || !sdkLoaded}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting verification...
              </>
            ) : !sdkLoaded ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading verification system...
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
            <strong>LOW_CODE_SDK Integration:</strong>
            <div className="mt-1 space-y-1">
              <div>• Uses Medallion&apos;s simplified SDK for easy integration</div>
              <div>• Automatic user creation and management</div>
              <div>• Session tracking for security and state management</div>
              <div>• Real-time status updates via webhooks</div>
              <div>• Complete verification and return here automatically</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default MedallionVerificationSDK;
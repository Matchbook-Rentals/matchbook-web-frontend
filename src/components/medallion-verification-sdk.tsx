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
          middleName,
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

  const requirements = [
    "Government-issued photo ID (driver's license, passport, etc.)",
    "Camera or smartphone for document capture",
    "Good lighting for clear photos",
    "A few minutes to complete the process"
  ];

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

      <div className="flex flex-col max-w-6xl items-start justify-center gap-6 mx-auto p-6">
        <div className="flex flex-col items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]">

          {/* Error Display */}
          {verificationStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-full">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Verification Failed</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Display */}
          {verificationStatus === 'completed' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg max-w-full">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Verification Complete</p>
                  <p className="text-sm text-green-600">Your identity has been successfully verified.</p>
                </div>
              </div>
            </div>
          )}

          <Card className="relative self-stretch w-full min-h-[448px] rounded-2xl overflow-hidden border border-solid border-[#cfd4dc]">
            <CardContent className="p-6">
              <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-blackblack-500 text-xl tracking-[0] leading-[24.0px] mb-6">
                What you&apos;ll need
              </h2>

              <div className="relative max-w-full mb-6 [font-family:'Poppins',Helvetica] font-medium text-[#333333] text-base tracking-[0] leading-[28.8px]">
                {requirements.map((requirement, index) => (
                  <div key={index}>
                    {requirement}
                    {index < requirements.length - 1 && <br />}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleVerification}
                disabled={isLoading || verificationStatus === 'completed' || !firstName || !lastName || !dob || !sdkLoaded}
                className="w-full md:w-1/2 h-[60px] bg-[#3c8787] hover:bg-[#2d6666] text-white rounded-lg [font-family:'Poppins',Helvetica] font-semibold text-base"
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
                  'Continue'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default MedallionVerificationSDK;
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, AlertCircle, Loader2 } from "lucide-react";

// Extend the Window interface to include the identify function
declare global {
  interface Window {
    identify?: (
      sdkKey: string,
      userConfig: {
        email: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        dob?: string;
        preferredWorkflowID?: string;
        redirectURL?: string;
      },
      errorHandler?: (error: { message: string }) => void
    ) => void;
  }
}

export interface MedallionVerificationProps {
  userEmail: string;
  onVerificationComplete?: (result: any) => void;
  onVerificationError?: (error: any) => void;
}

export const MedallionVerification: React.FC<MedallionVerificationProps> = ({
  userEmail,
  onVerificationComplete,
  onVerificationError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);

  // Check if Medallion script is loaded and ready
  useEffect(() => {
    const checkScript = () => {
      if (window.identify) {
        setIsScriptReady(true);
        console.log('✅ Medallion script is ready');
      } else {
        console.log('⏳ Waiting for Medallion script to load...');
        setTimeout(checkScript, 100);
      }
    };

    checkScript();
  }, []);

  const handleVerification = async () => {
    if (!window.identify) {
      setErrorMessage('Medallion verification script not loaded. Please refresh and try again.');
      setVerificationStatus('error');
      return;
    }

    const sdkKey = process.env.NEXT_PUBLIC_MEDALLION_LOW_CODE_SDK_KEY;
    if (!sdkKey) {
      setErrorMessage('Medallion SDK key not configured. Please contact support.');
      setVerificationStatus('error');
      return;
    }

    setIsLoading(true);
    setVerificationStatus('verifying');
    setErrorMessage(null);

    console.log('🚀 Starting Medallion verification with LOW_CODE_SDK');
    console.log('📧 Email:', userEmail);
    console.log('🔑 SDK Key present:', !!sdkKey);

    try {
      // Optional: Call our API to mark verification as started (for database tracking)
      try {
        await fetch('/api/medallion/initiate-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail }),
        });
      } catch (apiError) {
        console.warn('Failed to update verification status in database:', apiError);
        // Continue with verification even if database update fails
      }

      const userConfig = {
        email: userEmail,
        redirectURL: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/app/host/onboarding/identity-verification?completed=true`,
      };

      console.log('📤 Calling Medallion identify() with config:', userConfig);

      // Call Medallion's identify function
      window.identify(
        sdkKey,
        userConfig,
        (error: { message: string }) => {
          console.error('❌ Medallion verification error:', error);
          setIsLoading(false);
          setVerificationStatus('error');
          setErrorMessage(error.message || 'Verification failed');
          onVerificationError?.(error);
        }
      );

      // The identify function will redirect the user to Medallion's verification flow
      // So we don't need to do anything else here - the user will be redirected
      console.log('✅ Medallion identify() called successfully - user will be redirected');

    } catch (error) {
      console.error('❌ Error calling Medallion identify():', error);
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

        {!isScriptReady && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-blue-800">Loading Verification System</p>
              <p className="text-sm text-blue-600">Please wait while we prepare the verification interface...</p>
            </div>
          </div>
        )}

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
          disabled={isLoading || verificationStatus === 'completed' || !isScriptReady}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirecting to Verification...
            </>
          ) : !isScriptReady ? (
            'Loading...'
          ) : (
            'Begin Identity Verification'
          )}
        </Button>

        <div className="text-xs text-blue-700 p-3 bg-blue-50 border border-blue-200 rounded">
          <strong>Real Medallion Integration:</strong>
          <div className="mt-1 space-y-1">
            <div>• Using Medallion&apos;s LOW_CODE_SDK</div>
            <div>• You&apos;ll be redirected to Medallion&apos;s secure verification platform</div>
            <div>• Complete verification and return here automatically</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedallionVerification;
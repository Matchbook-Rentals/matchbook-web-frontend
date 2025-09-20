"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, AlertCircle } from "lucide-react";

export interface MedallionVerificationProps {
  userEmail: string;
  firstName?: string;
  lastName?: string;
  onVerificationComplete?: (medallionUserId: string) => void;
  onVerificationError?: (error: any) => void;
  isTestMode?: boolean;
}

export const MedallionVerification: React.FC<MedallionVerificationProps> = ({
  userEmail,
  firstName,
  lastName,
  onVerificationComplete,
  onVerificationError,
  isTestMode = false // Always use production mode by default
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerification = async () => {
    setIsLoading(true);
    setVerificationStatus('verifying');
    setErrorMessage(null);

    try {
      // Use secure server-side verification initiation
      const response = await fetch('/api/medallion/initiate-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          firstName: firstName || '',
          lastName: lastName || '',
          isTestMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setIsLoading(false);

      if (data.success) {
        // For test mode, the verification is completed server-side
        if (isTestMode) {
          setVerificationStatus('completed');
          onVerificationComplete?.(data.verificationId);
        } else {
          // For production, redirect to Medallion's verification URL
          if (data.redirectRequired && data.verificationUrl) {
            setVerificationStatus('completed');
            // Redirect to Medallion's hosted verification flow
            window.location.href = data.verificationUrl;
            return; // Don't continue processing since we're redirecting
          } else {
            setErrorMessage('Verification URL not provided by server');
          }
        }
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
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
          {isTestMode && (
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
              TEST MODE
            </span>
          )}
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
          disabled={isLoading || verificationStatus === 'completed'}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Starting Verification...' : 'Begin Identity Verification'}
        </Button>

        <div className="text-xs text-orange-700 p-3 bg-orange-50 border border-orange-200 rounded">
          <strong>Currently Using Mock APIs:</strong>
          <div className="mt-1 space-y-1">
            <div>• Production endpoints returned 404 errors</div>
            <div>• Using working mock endpoints temporarily</div>
            <div>• <strong>Jonathan</strong> → userAccessCode: 100385a1...</div>
            <div>• <strong>Other names</strong> → userAccessCode: 2d91a19f...</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedallionVerification;
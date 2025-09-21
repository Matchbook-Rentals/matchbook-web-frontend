"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MedallionVerification } from "@/components/medallion-verification";
import { MedallionScriptLoader } from "@/components/medallion-script-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle, Calendar } from "lucide-react";

interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  medallionIdentityVerified: boolean | null;
  medallionVerificationStatus: string | null;
  medallionUserId: string | null;
}

interface IdentityVerificationClientProps {
  userData: UserData;
  redirectUrl?: string;
}

export default function IdentityVerificationClient({
  userData,
  redirectUrl,
}: IdentityVerificationClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUpdating, setIsUpdating] = useState(false);
  const [verificationCompleted, setVerificationCompleted] = useState(false);

  // Pre-verification form state
  const [showPreForm, setShowPreForm] = useState(false);
  const [middleName, setMiddleName] = useState(userData.middleName || "");
  const [hasNoMiddleName, setHasNoMiddleName] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [preFormErrors, setPreFormErrors] = useState<{[key: string]: string}>({});

  // Check if we need to collect additional information
  useEffect(() => {
    const needsMiddleName = !userData.middleName && !hasNoMiddleName;
    const needsDOB = !dateOfBirth;
    setShowPreForm(needsMiddleName || needsDOB);
  }, [userData.middleName, hasNoMiddleName, dateOfBirth]);

  // Check if user was redirected back from Medallion
  useEffect(() => {
    const completed = searchParams.get('completed');
    if (completed === 'true') {
      setVerificationCompleted(true);
      // Check verification status and handle accordingly
      handleVerificationReturn();
    }
  }, [searchParams, handleVerificationReturn]);

  const handleVerificationReturn = useCallback(async () => {
    setIsUpdating(true);
    try {
      // Refresh user data to check if verification was completed
      const response = await fetch('/api/user/verification-status');
      if (response.ok) {
        const result = await response.json();
        if (result.verified) {
          // Verification was successful, redirect to dashboard
          const targetUrl = redirectUrl || "/app/host/dashboard/overview";
          router.push(targetUrl);
        } else {
          // Verification might still be pending or failed
          setVerificationCompleted(false);
          setIsUpdating(false);
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setVerificationCompleted(false);
      setIsUpdating(false);
    }
  }, [router, redirectUrl]);

  const handleVerificationComplete = async (medallionUserId: string) => {
    setIsUpdating(true);

    try {
      const response = await fetch("/api/user/medallion-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medallionUserId,
          verificationStatus: "approved",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update verification status");
      }

      // Redirect back to the original page or dashboard
      const targetUrl = redirectUrl || "/app/host/dashboard/overview";
      router.push(targetUrl);
    } catch (error) {
      console.error("Error updating verification status:", error);
      setIsUpdating(false);
    }
  };

  const handleVerificationError = (error: any) => {
    console.error("Verification error:", error);
    // Could show a toast or error message here
  };

  const handleGoBack = () => {
    const targetUrl = redirectUrl || "/app/host/dashboard/overview";
    router.push(targetUrl);
  };

  const validatePreForm = () => {
    const errors: {[key: string]: string} = {};

    if (!userData.middleName && !hasNoMiddleName && !middleName.trim()) {
      errors.middleName = "Middle name is required or check 'No middle name'";
    }

    if (!dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required";
    } else {
      // Validate date format (YYYY-MM-DD from input, need to convert to MM-DD-YYYY for Medallion)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) {
        errors.dateOfBirth = "Please enter a valid date";
      }
    }

    setPreFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePreFormSubmit = () => {
    if (validatePreForm()) {
      setShowPreForm(false);
    }
  };

  const formatDateForMedallion = (isoDate: string) => {
    // Convert YYYY-MM-DD to MM-DD-YYYY as required by Medallion
    const [year, month, day] = isoDate.split('-');
    return `${month}-${day}-${year}`;
  };

  // Show completion message if returning from Medallion
  if (verificationCompleted && isUpdating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Completed
            </h1>
            <p className="text-gray-600 mb-4">
              Thank you for completing your identity verification. We&apos;re processing your information...
            </p>
            <div className="animate-pulse text-blue-600">
              Updating your account...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show pre-verification form if additional info is needed
  if (showPreForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Additional Information Required
            </h1>
            <p className="text-gray-600">
              Please provide the following information to complete your identity verification.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!userData.middleName && (
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    disabled={hasNoMiddleName}
                    placeholder="Enter your middle name"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="noMiddleName"
                      checked={hasNoMiddleName}
                      onCheckedChange={(checked) => {
                        setHasNoMiddleName(checked as boolean);
                        if (checked) setMiddleName("");
                      }}
                    />
                    <Label htmlFor="noMiddleName" className="text-sm">
                      I don&apos;t have a middle name
                    </Label>
                  </div>
                  {preFormErrors.middleName && (
                    <p className="text-sm text-red-600">{preFormErrors.middleName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <div className="relative">
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {preFormErrors.dateOfBirth && (
                  <p className="text-sm text-red-600">{preFormErrors.dateOfBirth}</p>
                )}
              </div>

              <Button onClick={handlePreFormSubmit} className="w-full">
                Continue to Verification
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Identity Verification
          </h1>
          <p className="text-gray-600">
            Complete your identity verification to continue with host onboarding.
            This helps us ensure the safety and security of our platform.
          </p>
        </div>

        <MedallionScriptLoader>
          <MedallionVerification
            userEmail={userData.email || ""}
            firstName={userData.firstName || undefined}
            middleName={userData.middleName || middleName || (hasNoMiddleName ? "" : undefined)}
            lastName={userData.lastName || undefined}
            dob={dateOfBirth ? formatDateForMedallion(dateOfBirth) : undefined}
            onVerificationComplete={handleVerificationComplete}
            onVerificationError={handleVerificationError}
          />
        </MedallionScriptLoader>

        {isUpdating && !verificationCompleted && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              Updating your verification status...
            </p>
          </div>
        )}

        {/* DEVELOPMENT MODE UI (PRESERVED FOR FUTURE USE) - Currently disabled
        {isTestMode && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-medium text-orange-800 mb-2">Development Mode</h3>
            <p className="text-sm text-orange-700">
              You're in development mode. This integration uses Medallion's mock APIs
              for testing purposes. In production, this would perform real identity verification.
            </p>
          </div>
        )}
        */}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Medallion Identity Verification</h3>
          <p className="text-sm text-blue-700">
            You&apos;ll be redirected to Medallion&apos;s secure verification platform.
            Complete your identity verification and you&apos;ll be brought back here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
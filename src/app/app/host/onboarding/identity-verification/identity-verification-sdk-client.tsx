"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateOfBirthPicker } from "@/components/ui/date-of-birth-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, User, Edit, Save, X, Loader2, AlertTriangle, XCircle, Clock, RefreshCw, Check, ExternalLink } from "lucide-react";
import { confirmAuthenticatedName, updateAuthenticatedName } from "@/app/actions/user";

// Helper functions for date format conversion
const convertToHtmlDate = (ddmmyyyy: string): string => {
  if (!ddmmyyyy) return "";
  const [day, month, year] = ddmmyyyy.split('-');
  return `${year}-${month}-${day}`;
};

const convertToDDMMYYYY = (htmlDate: string): string => {
  if (!htmlDate) return "";
  const [year, month, day] = htmlDate.split('-');
  return `${day}-${month}-${year}`;
};

// Helper functions for DateOfBirthPicker
const convertHtmlDateToDate = (htmlDate: string): Date | null => {
  if (!htmlDate) return null;
  const [year, month, day] = htmlDate.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

const convertDateToHtmlDate = (date: Date | null): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  authenticatedFirstName: string | null;
  authenticatedMiddleName: string | null;
  authenticatedLastName: string | null;
  authenticatedDateOfBirth: string | null;
  medallionIdentityVerified: boolean | null;
  medallionVerificationStatus: string | null;
  medallionUserId: string | null;
}

interface IdentityVerificationSDKClientProps {
  userData: UserData;
  redirectUrl?: string;
  isReturningFromVerification?: boolean;
  error?: string;
}

export default function IdentityVerificationSDKClient({
  userData,
  redirectUrl,
  isReturningFromVerification = false,
  error,
}: IdentityVerificationSDKClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'confirm' | 'requirements' | 'verify'>('confirm');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNameConfirmation, setShowNameConfirmation] = useState(true);

  // Main confirmation form state
  const [confirmDateOfBirth, setConfirmDateOfBirth] = useState(
    convertToHtmlDate(userData.authenticatedDateOfBirth || "")
  );

  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFirstName, setEditFirstName] = useState(userData.firstName || "");
  const [editMiddleName, setEditMiddleName] = useState(userData.authenticatedMiddleName || "");
  const [editLastName, setEditLastName] = useState(userData.lastName || "");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [localUserData, setLocalUserData] = useState(userData);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Medallion SDK state
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle errors from URL parameters
  useEffect(() => {
    if (error) {
      switch (error) {
        case 'invalid_redirect':
          setRedirectError('Invalid verification redirect. Please try starting the verification process again.');
          break;
        case 'invalid_session':
          setRedirectError('Verification session expired. Please start the verification process again.');
          break;
        default:
          setRedirectError('An error occurred during verification. Please try again.');
      }
    }
  }, [error]);

  // Check if user is already verified
  useEffect(() => {
    if (localUserData.medallionIdentityVerified && !isReturningFromVerification) {
      const targetUrl = redirectUrl || "/app/host/dashboard/overview";
      router.push(targetUrl);
    }
  }, [localUserData.medallionIdentityVerified, isReturningFromVerification, redirectUrl, router]);

  // Handle returning from verification
  useEffect(() => {
    if (isReturningFromVerification) {
      // Refresh page data to get latest verification status
      window.location.reload();
    }
  }, [isReturningFromVerification]);

  const handleConfirmName = async () => {
    if (!confirmDateOfBirth) {
      setUpdateError("Please enter your date of birth");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const result = await confirmAuthenticatedName(convertToDDMMYYYY(confirmDateOfBirth));

      if (result.success) {
        setShowNameConfirmation(false);
        setCurrentStep('requirements');
        // Update local state to reflect confirmation
        setLocalUserData(prev => ({
          ...prev,
          authenticatedFirstName: prev.firstName,
          authenticatedLastName: prev.lastName,
          authenticatedDateOfBirth: convertToDDMMYYYY(confirmDateOfBirth),
        }));
      } else {
        setUpdateError(result.error || "Failed to confirm information");
      }
    } catch (error) {
      setUpdateError("Failed to confirm information");
      console.error('Error confirming name:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editFirstName.trim() || !editLastName.trim() || !editDateOfBirth) {
      setUpdateError("First name, last name, and date of birth are required");
      return;
    }

    setIsUpdatingName(true);
    setUpdateError(null);

    try {
      const result = await updateAuthenticatedName(
        editFirstName.trim(),
        editMiddleName.trim() || null, // Allow empty middle name
        editLastName.trim(),
        convertToDDMMYYYY(editDateOfBirth)
      );

      if (result.success) {
        setLocalUserData(prev => ({
          ...prev,
          authenticatedFirstName: editFirstName.trim(),
          authenticatedMiddleName: editMiddleName.trim() || null,
          authenticatedLastName: editLastName.trim(),
          authenticatedDateOfBirth: convertToDDMMYYYY(editDateOfBirth),
        }));
        setShowEditForm(false);
        setShowNameConfirmation(false);
        setCurrentStep('requirements');
      } else {
        setUpdateError(result.error || "Failed to update information");
      }
    } catch (error) {
      setUpdateError("Failed to update information");
      console.error('Error updating name:', error);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleRetryVerification = async () => {
    setIsResetting(true);
    setResetError(null);

    try {
      const response = await fetch('/api/medallion/reset-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset verification');
      }

      // Reset local state to allow retry
      setLocalUserData(prev => ({
        ...prev,
        medallionVerificationStatus: null,
        medallionIdentityVerified: false,
      }));

      // Clear any errors
      setRedirectError(null);
      setResetError(null);

      console.log('✅ Verification reset successfully, ready to retry');
    } catch (error) {
      console.error('❌ Error resetting verification:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to reset verification';
      setResetError(errorMsg);
    } finally {
      setIsResetting(false);
    }
  };

  const logError = async (error: Error | string, context?: { [key: string]: any }) => {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorMessage: typeof error === 'string' ? error : error.message,
          errorStack: typeof error === 'object' && error.stack ? error.stack : null,
          pathname: '/app/host/onboarding/identity-verification',
          userAgent: navigator.userAgent,
          isAuthError: false,
          ...context
        }),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  const handleBackButton = () => {
    if (currentStep === 'requirements') {
      setCurrentStep('confirm');
      setShowNameConfirmation(true);
    } else {
      router.back();
    }
  };

  const handleVerification = async () => {
    // Validate required fields
    if (!localUserData.authenticatedFirstName || !localUserData.authenticatedLastName || !localUserData.authenticatedDateOfBirth) {
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

    setIsUpdating(true);
    setVerificationStatus('verifying');
    setErrorMessage(null);

    console.log('🚀 Starting Medallion verification using LOW_CODE_SDK approach');
    console.log('📧 Email:', localUserData.email);
    console.log('👤 Name:', localUserData.authenticatedFirstName, localUserData.authenticatedLastName);
    console.log('📅 DOB:', localUserData.authenticatedDateOfBirth);

    try {
      // First, track this verification session on our backend
      const sessionResponse = await fetch('/api/medallion/track-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: localUserData.email,
          firstName: localUserData.authenticatedFirstName,
          middleName: localUserData.authenticatedMiddleName,
          lastName: localUserData.authenticatedLastName,
          dob: localUserData.authenticatedDateOfBirth,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to initialize verification session');
      }

      const sessionData = await sessionResponse.json();
      console.log('✅ Session created:', sessionData.sessionToken);

      // Call Medallion's identify function with our user data
      const redirectURL = `${window.location.origin}/app/host/onboarding/identity-verification?completed=true&redirect_url=${encodeURIComponent(redirectUrl || "/app/host/dashboard/overview")}`;

      window.identify(
        process.env.NEXT_PUBLIC_MEDALLION_LOW_CODE_SDK_KEY!,
        {
          email: localUserData.email || "",
          firstName: localUserData.authenticatedFirstName || "",
          middleName: localUserData.authenticatedMiddleName || "",
          lastName: localUserData.authenticatedLastName || "",
          dob: localUserData.authenticatedDateOfBirth || "",
          redirectURL: redirectURL,
        },
        (error: { message: string }) => {
          console.error('❌ Medallion verification error:', error);
          logError(`Medallion verification failed: ${error.message}`, {
            context: 'medallion_callback_error',
            originalMessage: error.message
          });
          const userMessage = error.message.includes('Failed to fetch')
            ? 'Verification is currently unavailable, please try again later'
            : 'Verification is currently unavailable, please try again later';
          setErrorMessage(userMessage);
          setVerificationStatus('error');
          setIsUpdating(false);
        }
      );

      console.log('🚀 Medallion verification started, redirecting to external verification...');
    } catch (error) {
      console.error('❌ Error starting verification:', error);
      const originalError = error instanceof Error ? error.message : 'Failed to start verification';
      logError(error instanceof Error ? error : new Error(originalError), {
        context: 'verification_start_error',
        originalMessage: originalError
      });
      const userMessage = originalError.includes('Failed to fetch')
        ? 'Verification is currently unavailable, please try again later'
        : 'Verification is currently unavailable, please try again later';
      setErrorMessage(userMessage);
      setVerificationStatus('error');
      setIsUpdating(false);
    }
  };

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

  const requirements = [
    "Government-issued photo ID (driver's license, passport, etc.)",
    "Camera or smartphone for document capture",
    "Good lighting for clear photos",
    "A few minutes to complete the process"
  ];

  // If already verified, show success and redirect
  if (localUserData.medallionIdentityVerified) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Identity Verification Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Your identity has been successfully verified. Redirecting you to continue...
            </p>
            <Button
              onClick={() => router.push(redirectUrl || "/app/host/dashboard/overview")}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle verification failure states
  if (localUserData.medallionVerificationStatus === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-6 w-6" />
              Verification Not Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">Your documents could not be verified.</p>
              <p className="text-red-700 text-sm">This usually happens when:</p>
              <ul className="text-red-700 text-sm mt-2 space-y-1 list-disc list-inside">
                <li>Document images are blurry, have glare, or shadows</li>
                <li>Name on ID doesn&apos;t exactly match your profile</li>
                <li>Date of birth information is incorrect</li>
                <li>Document is expired or damaged</li>
              </ul>
            </div>

            {resetError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{resetError}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleRetryVerification}
                disabled={isResetting}
                className="w-full"
                variant="default"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Verification Again
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>

            <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded">
              <strong>Tips for successful verification:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Use good lighting with no glare or shadows</li>
                <li>Ensure your full name matches exactly as on your ID</li>
                <li>Double-check your date of birth is correct</li>
                <li>Use a current, valid government-issued ID</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (localUserData.medallionVerificationStatus === 'failed') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-6 w-6" />
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">Verification failed due to a technical issue.</p>
              <p className="text-red-700 text-sm">
                This could be due to system connectivity issues or processing errors. Please try again.
              </p>
            </div>

            {resetError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{resetError}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleRetryVerification}
                disabled={isResetting}
                className="w-full"
                variant="default"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (localUserData.medallionVerificationStatus === 'expired') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Clock className="h-6 w-6" />
              Verification Session Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 font-medium mb-2">Your verification session has expired.</p>
              <p className="text-orange-700 text-sm">
                Verification links expire after a certain time for security purposes. Please start a new verification.
              </p>
            </div>

            {resetError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{resetError}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleRetryVerification}
                disabled={isResetting}
                className="w-full"
                variant="default"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting New Session...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start New Verification
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCardContent = () => {
    if (currentStep === 'confirm') {
      return (
        <>
          <h2 className="max-w-full [font-family:'Poppins',Helvetica] font-semibold text-blackblack-500 text-xl tracking-[0] leading-[24.0px] mb-12">
            Please provide the following information as it appears on your ID
          </h2>

          {showEditForm ? (
            <>
              <div className="flex max-w-3xl h-[74px] items-start gap-5 mb-6">
                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label
                          htmlFor="editFirstName"
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        >
                          First Name
                        </Label>
                      </div>
                      <Input
                        id="editFirstName"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label
                          htmlFor="editMiddleName"
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        >
                          Middle Name
                        </Label>
                      </div>
                      <Input
                        id="editMiddleName"
                        value={editMiddleName}
                        onChange={(e) => setEditMiddleName(e.target.value)}
                        className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label
                          htmlFor="editLastName"
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        >
                          Last Name
                        </Label>
                      </div>
                      <Input
                        id="editLastName"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-full h-[74px] gap-5 flex items-start mb-6">
                <div className="flex flex-col max-w-2xl items-start gap-1.5 relative">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label
                          htmlFor="editDateOfBirth"
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        >
                          Date of Birth
                        </Label>
                      </div>
                      <DateOfBirthPicker
                        value={convertHtmlDateToDate(editDateOfBirth)}
                        onChange={(date) => setEditDateOfBirth(convertDateToHtmlDate(date))}
                        placeholder="MM/DD/YYYY"
                        className="h-12 border-[#d0d5dd] shadow-shadows-shadow-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative" />
              </div>

              {updateError && (
                <div className="text-red-600 text-sm mb-6">{updateError}</div>
              )}

              <Button
                onClick={handleUpdateName}
                disabled={isUpdatingName}
                className="w-full md:w-1/2 h-[60px] bg-[#3c8787] hover:bg-[#2d6666] text-white rounded-lg [font-family:'Poppins',Helvetica] font-semibold text-base"
              >
                {isUpdatingName ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex max-w-3xl h-[74px] items-start gap-5 mb-6">
                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label
                          htmlFor="confirmFirstName"
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        >
                          First Name
                        </Label>
                      </div>
                      <Input
                        id="confirmFirstName"
                        defaultValue={localUserData.firstName || ""}
                        className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label
                          htmlFor="confirmMiddleName"
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        >
                          Middle Name
                        </Label>
                      </div>
                      <Input
                        id="confirmMiddleName"
                        defaultValue={localUserData.authenticatedMiddleName || ""}
                        className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label
                          htmlFor="confirmLastName"
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        >
                          Last Name
                        </Label>
                      </div>
                      <Input
                        id="confirmLastName"
                        defaultValue={localUserData.lastName || ""}
                        className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-full h-[74px] gap-5 flex items-start mb-6">
                <div className="flex flex-col max-w-2xl items-start gap-1.5 relative">
                  <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label
                          htmlFor="confirmDateOfBirth"
                          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap"
                        >
                          Date of Birth
                        </Label>
                      </div>
                      <DateOfBirthPicker
                        value={convertHtmlDateToDate(confirmDateOfBirth)}
                        onChange={(date) => setConfirmDateOfBirth(convertDateToHtmlDate(date))}
                        placeholder="MM/DD/YYYY"
                        className="h-12 border-[#d0d5dd] shadow-shadows-shadow-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-col items-start gap-1.5 flex-1 grow flex relative" />
              </div>

              {updateError && (
                <div className="text-red-600 text-sm mb-6">{updateError}</div>
              )}

              <Button
                onClick={handleConfirmName}
                disabled={isUpdating}
                className="w-full md:w-1/2 h-[60px] bg-[#3c8787] hover:bg-[#2d6666] text-white rounded-lg [font-family:'Poppins',Helvetica] font-semibold text-base"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </>
          )}
        </>
      );
    }

    if (currentStep === 'requirements') {
      return (
        <>
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
            disabled={isUpdating || verificationStatus === 'completed' || !sdkLoaded}
            className="w-full md:w-1/2 h-[60px] bg-[#3c8787] hover:bg-[#2d6666] text-white rounded-lg [font-family:'Poppins',Helvetica] font-semibold text-base"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting verification...
              </>
            ) : !sdkLoaded ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading verification system...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </>
      );
    }

    return null;
  };

  return (
    <>
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

      <div className="flex flex-col max-w-6xl items-start justify-center gap-4 mx-auto p-6">
        <div className="inline-flex items-center gap-4 relative flex-[0_0_auto]">
          <Button
            variant="ghost"
            className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto] h-auto p-0 hover:bg-transparent"
            onClick={handleBackButton}
          >
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#3c8787] text-base tracking-[0] leading-6 whitespace-nowrap">
              ← Back
            </div>
          </Button>
        </div>

        <div className="flex flex-col items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col max-w-3xl items-start gap-1 relative flex-[0_0_auto]">
            <h1 className="relative self-stretch mt-[-1.00px] font-text-heading-medium-medium font-[number:var(--text-heading-medium-medium-font-weight)] text-[#373940] text-[length:var(--text-heading-medium-medium-font-size)] tracking-[var(--text-heading-medium-medium-letter-spacing)] leading-[var(--text-heading-medium-medium-line-height)] [font-style:var(--text-heading-medium-medium-font-style)]">
              Host Identity Verication
            </h1>

            <div className="flex-col justify-center gap-1.5 relative self-stretch w-full flex-[0_0_auto] flex items-start">
              <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                All hosts must verify their identify before accepting an
                application
              </p>
            </div>
          </div>

          {/* Error Display */}
          {(redirectError || errorMessage) && (
            <div className="relative self-stretch w-full p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {redirectError || errorMessage}
              </p>
            </div>
          )}

          {/* Success Display */}
          {verificationStatus === 'completed' && (
            <div className="relative self-stretch w-full p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Verification Complete</p>
                  <p className="text-sm text-green-600">Your identity has been successfully verified.</p>
                </div>
              </div>
            </div>
          )}

          {/* Single Card with Dynamic Content */}
          <Card className="relative self-stretch w-full min-h-[448px] rounded-2xl overflow-hidden border border-solid border-[#cfd4dc]">
            <CardContent className="p-6">
              {renderCardContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
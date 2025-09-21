"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MedallionVerification } from "@/components/medallion-verification";
import { MedallionScriptLoader } from "@/components/medallion-script-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, User, Edit, Save, X, Loader2 } from "lucide-react";
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

interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  authenticatedFirstName: string | null;
  authenticatedLastName: string | null;
  authenticatedDateOfBirth: string | null;
  medallionIdentityVerified: boolean | null;
  medallionVerificationStatus: string | null;
  medallionUserId: string | null;
}

interface IdentityVerificationClientProps {
  userData: UserData;
  redirectUrl?: string;
  isReturningFromVerification?: boolean;
}

export default function IdentityVerificationClient({
  userData,
  redirectUrl,
  isReturningFromVerification = false,
}: IdentityVerificationClientProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNameConfirmation, setShowNameConfirmation] = useState(true);

  // Main confirmation form state
  const [confirmDateOfBirth, setConfirmDateOfBirth] = useState(
    convertToHtmlDate(userData.authenticatedDateOfBirth || "")
  );

  // Polling state for verification status
  const [isPolling, setIsPolling] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [nextPollIn, setNextPollIn] = useState(0);
  const [pollTimeoutId, setPollTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [pollingStopped, setPollingStopped] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFirstName, setEditFirstName] = useState(userData.firstName || "");
  const [editLastName, setEditLastName] = useState(userData.lastName || "");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [localUserData, setLocalUserData] = useState(userData);

  // Linear backoff polling intervals
  const getPollingInterval = useCallback((attempt: number): number => {
    if (attempt <= 3) return 5000;    // 0-3: 5 seconds (quick initial checks)
    if (attempt <= 6) return 10000;   // 4-6: 10 seconds
    if (attempt <= 9) return 20000;   // 7-9: 20 seconds
    return 30000;                     // 10+: 30 seconds (max backoff)
  }, []);

  // Function to check verification status via API (polls Medallion directly)
  const checkVerificationStatus = useCallback(async () => {
    try {
      setIsPolling(true);
      console.log("🔍 Polling Medallion API for verification status...");

      const response = await fetch("/api/medallion/poll-status", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      // Handle 400 errors specifically (missing access code)
      if (response.status === 400) {
        const errorMessage = result.error || "Missing verification data";
        console.error("❌ 400 Error - stopping polling:", errorMessage);
        setLastError(errorMessage);
        setPollingStopped(true);
        return true; // Stop polling
      }

      if (!response.ok) {
        const errorMessage = `Failed to poll verification status: ${response.status}`;
        console.error("❌ API Error:", errorMessage);
        setLastError(errorMessage);
        setConsecutiveErrors(prev => prev + 1);

        // Stop polling after 3 consecutive errors
        if (consecutiveErrors >= 2) {
          console.error("❌ Too many consecutive errors - stopping polling");
          setPollingStopped(true);
          return true;
        }

        throw new Error(errorMessage);
      }

      if (result.success && result.data) {
        // Reset error count on successful response
        setConsecutiveErrors(0);
        setLastError(null);

        const { medallionIdentityVerified, medallionVerificationStatus } = result.data;

        console.log("📊 Verification status from Medallion:", {
          verified: medallionIdentityVerified,
          status: medallionVerificationStatus,
          medallionData: result.medallionData
        });

        // Update local user data with latest status from Medallion
        setLocalUserData(prev => ({
          ...prev,
          medallionIdentityVerified,
          medallionVerificationStatus,
        }));

        // If verified, redirect to dashboard
        if (medallionIdentityVerified) {
          console.log("✅ Verification completed successfully - redirecting");
          const targetUrl = redirectUrl || "/app/host/dashboard/overview";
          router.push(targetUrl);
          return true; // Status changed
        }

        // If explicitly failed, stop polling
        if (medallionVerificationStatus === 'rejected' ||
            medallionVerificationStatus === 'expired' ||
            medallionVerificationStatus === 'failed') {
          console.log("❌ Verification failed - stopping polling");
          return true; // Status changed
        }
      }

      return false; // No status change
    } catch (error) {
      console.error("Error polling Medallion verification status:", error);
      setLastError(error instanceof Error ? error.message : "Unknown error");
      setConsecutiveErrors(prev => prev + 1);

      // Stop polling after 3 consecutive errors
      if (consecutiveErrors >= 2) {
        console.error("❌ Too many consecutive errors - stopping polling");
        setPollingStopped(true);
        return true;
      }

      return false;
    } finally {
      setIsPolling(false);
    }
  }, [redirectUrl, router, consecutiveErrors]);

  // Countdown timer for next poll
  useEffect(() => {
    if (nextPollIn <= 0) return;

    const countdown = setInterval(() => {
      setNextPollIn(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(countdown);
  }, [nextPollIn]);

  // Schedule the next poll with backoff
  const scheduleNextPoll = useCallback((attempt: number) => {
    const maxAttempts = 15; // Max 15 attempts over ~5 minutes

    if (attempt >= maxAttempts || pollingStopped) {
      console.log('📊 Max polling attempts reached or polling stopped');
      setPollingStopped(true);
      return;
    }

    const interval = getPollingInterval(attempt);
    setNextPollIn(Math.floor(interval / 1000));

    const timeoutId = setTimeout(async () => {
      if (pollingStopped) {
        console.log('📊 Polling was stopped, skipping scheduled check');
        return;
      }

      const newAttempt = attempt + 1;
      setPollAttempts(newAttempt);

      const statusChanged = await checkVerificationStatus();

      if (!statusChanged && !pollingStopped) {
        scheduleNextPoll(newAttempt);
      }
    }, interval);

    setPollTimeoutId(timeoutId);
  }, [getPollingInterval, checkVerificationStatus, pollingStopped]);

  // Manual poll function
  const triggerManualPoll = useCallback(async () => {
    if (isPolling || pollingStopped) return;

    // Reset error state when manually polling
    setConsecutiveErrors(0);
    setLastError(null);
    setPollingStopped(false);

    // Cancel any scheduled polls
    if (pollTimeoutId) {
      clearTimeout(pollTimeoutId);
      setPollTimeoutId(null);
    }

    setNextPollIn(0);
    const statusChanged = await checkVerificationStatus();

    if (!statusChanged && !pollingStopped) {
      // If status didn't change, continue with scheduled polling
      scheduleNextPoll(pollAttempts + 1);
    }
  }, [isPolling, pollingStopped, pollTimeoutId, pollAttempts, checkVerificationStatus, scheduleNextPoll]);

  // Auto-polling effect when returning from verification
  useEffect(() => {
    if (!isReturningFromVerification) return;

    // Don't poll if already verified or explicitly failed
    if (localUserData.medallionIdentityVerified ||
        localUserData.medallionVerificationStatus === 'rejected' ||
        localUserData.medallionVerificationStatus === 'expired' ||
        localUserData.medallionVerificationStatus === 'failed') {
      return;
    }

    console.log('🔄 Starting linear backoff polling strategy');

    // Start with immediate first check
    const startPolling = async () => {
      setPollAttempts(1);
      const statusChanged = await checkVerificationStatus();

      if (!statusChanged) {
        scheduleNextPoll(1);
      }
    };

    startPolling();

    // Cleanup on unmount
    return () => {
      if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
      }
    };
  }, [isReturningFromVerification, localUserData.medallionIdentityVerified, localUserData.medallionVerificationStatus, checkVerificationStatus, scheduleNextPoll, pollTimeoutId]);

  const handleVerificationComplete = async (medallionUserId: string) => {
    setIsUpdating(true);

    // Medallion webhook will update verification status in database
    // Just redirect back with completion flag to check status
    const targetUrl = redirectUrl || "/app/host/dashboard/overview";
    const returnUrl = `/app/host/onboarding/identity-verification?completed=true${redirectUrl ? `&redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`;
    router.push(returnUrl);
  };

  const handleVerificationError = (error: any) => {
    console.error("Verification error:", error);
    // Could show a toast or error message here
  };

  const handleGoBack = () => {
    const targetUrl = redirectUrl || "/app/host/dashboard/overview";
    router.push(targetUrl);
  };

  const handleNameConfirmed = async () => {
    if (!confirmDateOfBirth) {
      setUpdateError("Date of birth is required for identity verification");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const dateOfBirthFormatted = convertToDDMMYYYY(confirmDateOfBirth);
      const result = await confirmAuthenticatedName(dateOfBirthFormatted);

      if (result.success) {
        // Update local state with confirmed names and DOB
        const updatedUserData = {
          ...localUserData,
          authenticatedFirstName: localUserData.firstName,
          authenticatedLastName: localUserData.lastName,
          authenticatedDateOfBirth: dateOfBirthFormatted,
        };
        setLocalUserData(updatedUserData);
        setShowNameConfirmation(false);
        router.refresh();
      } else {
        setUpdateError(result.error || "Failed to confirm information");
      }
    } catch (error) {
      setUpdateError("Failed to confirm information. Please try again.");
      console.error("Error confirming information:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditName = () => {
    setShowEditForm(true);
    setUpdateError(null);
    // Pre-populate with authenticated names if available, otherwise display names
    setEditFirstName(localUserData.authenticatedFirstName || localUserData.firstName || "");
    setEditLastName(localUserData.authenticatedLastName || localUserData.lastName || "");
    setEditDateOfBirth(convertToHtmlDate(localUserData.authenticatedDateOfBirth || ""));
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setUpdateError(null);
    // Reset form values to current authenticated or display names
    setEditFirstName(localUserData.authenticatedFirstName || localUserData.firstName || "");
    setEditLastName(localUserData.authenticatedLastName || localUserData.lastName || "");
    setEditDateOfBirth(convertToHtmlDate(localUserData.authenticatedDateOfBirth || ""));
  };

  const handleNameUpdate = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      setUpdateError("First name and last name are required");
      return;
    }

    if (!editDateOfBirth) {
      setUpdateError("Date of birth is required for identity verification");
      return;
    }

    setIsUpdatingName(true);
    setUpdateError(null);

    try {
      const dateOfBirthFormatted = convertToDDMMYYYY(editDateOfBirth);
      const result = await updateAuthenticatedName(editFirstName.trim(), editLastName.trim(), dateOfBirthFormatted);

      if (result.success) {
        // Update local state with new authenticated values
        const updatedUserData = {
          ...localUserData,
          authenticatedFirstName: editFirstName.trim(),
          authenticatedLastName: editLastName.trim(),
          authenticatedDateOfBirth: dateOfBirthFormatted,
        };
        setLocalUserData(updatedUserData);

        // Hide edit form and show updated confirmation
        setShowEditForm(false);

        // Soft refresh to get latest server data
        router.refresh();
      } else {
        setUpdateError(result.error || "Failed to update information");
      }
    } catch (error) {
      setUpdateError("Failed to update information. Please try again.");
      console.error("Error updating authenticated information:", error);
    } finally {
      setIsUpdatingName(false);
    }
  };


  // Show status message if returning from Medallion but not yet verified
  if (isReturningFromVerification) {
    const { medallionVerificationStatus } = localUserData;

    // Handle different verification statuses
    if (medallionVerificationStatus === 'rejected' || medallionVerificationStatus === 'failed') {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-2xl mx-auto py-8 px-4 text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="h-16 w-16 text-red-500 mx-auto mb-4">
                <X className="h-full w-full" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-4">
                Your identity verification was not successful. You can try again or contact support if you need assistance.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button onClick={handleGoBack} variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (medallionVerificationStatus === 'expired') {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-2xl mx-auto py-8 px-4 text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="h-16 w-16 text-orange-500 mx-auto mb-4">
                <CheckCircle className="h-full w-full" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Expired
              </h1>
              <p className="text-gray-600 mb-4">
                Your verification session has expired. Please start a new verification.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Start New Verification
                </Button>
                <Button onClick={handleGoBack} variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default: processing/pending status
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="h-16 w-16 text-orange-500 mx-auto mb-4">
              {isPolling ? (
                <Loader2 className="h-full w-full animate-spin" />
              ) : (
                <CheckCircle className="h-full w-full" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {pollingStopped ? "Verification Status Check" : "Verification Processing"}
            </h1>
            <p className="text-gray-600 mb-4">
              {pollingStopped
                ? "There was an issue checking your verification status. Please try again or contact support if the problem persists."
                : `Your identity verification is being processed. ${isPolling ? "Checking status..." : "This may take a few moments."}`
              }
            </p>
            {lastError && pollingStopped && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {lastError}
                </p>
              </div>
            )}
            {pollAttempts > 0 && !pollingStopped && (
              <div className="text-sm text-gray-500 mb-4 space-y-1">
                <p>Status check attempt: {pollAttempts}/15</p>
                {nextPollIn > 0 && (
                  <p>Next automatic check in: {nextPollIn} seconds</p>
                )}
                {nextPollIn === 0 && pollAttempts < 15 && (
                  <p>⏳ Checking status...</p>
                )}
              </div>
            )}
            {pollingStopped && (
              <div className="text-sm text-gray-500 mb-4">
                <p>Automatic status checking has been stopped due to errors.</p>
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={triggerManualPoll}
                variant="outline"
                className="w-full"
                disabled={isPolling}
              >
                {isPolling ? "Checking..." : pollingStopped ? "Retry Status Check" : "Check Status Now"}
              </Button>
              <Button onClick={handleGoBack} variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show name confirmation before verification
  if (showNameConfirmation) {
    // Check if we already have authenticated names to pre-populate display
    const hasAuthenticatedName = localUserData.authenticatedFirstName && localUserData.authenticatedLastName;

    // Show authenticated names if available, otherwise display names
    const displayName = hasAuthenticatedName
      ? `${localUserData.authenticatedFirstName} ${localUserData.authenticatedLastName}`.trim()
      : `${localUserData.firstName || ''} ${localUserData.lastName || ''}`.trim();
    const hasDisplayName = hasAuthenticatedName || (localUserData.firstName && localUserData.lastName);

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
              Confirm Your Legal Name
            </h1>
            <p className="text-gray-600">
              Please confirm this is your legal name exactly as it appears on your government-issued ID.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Name Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {showEditForm ? (
                // Edit Form UI
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      Update Your Legal Name
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enter your name exactly as it appears on your government-issued ID
                    </p>
                  </div>

                  {updateError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{updateError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        disabled={isUpdatingName}
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="Enter your last name"
                        disabled={isUpdatingName}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={editDateOfBirth}
                        onChange={(e) => setEditDateOfBirth(e.target.value)}
                        disabled={isUpdatingName}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This must match your government-issued ID exactly
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleNameUpdate}
                      disabled={isUpdatingName || !editFirstName.trim() || !editLastName.trim() || !editDateOfBirth}
                      className="flex-1"
                    >
                      {isUpdatingName ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Name
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      disabled={isUpdatingName}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // Confirmation UI
                <>
                  <div className="text-center py-4">
                    <div className="text-2xl font-semibold text-gray-900 mb-2">
                      {hasDisplayName ? displayName : "No name on file"}
                    </div>
                    <p className="text-sm text-gray-600">
                      This name will be used for identity verification with Medallion
                    </p>
                  </div>

                  {updateError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{updateError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="confirmDateOfBirth">Date of Birth</Label>
                      <Input
                        id="confirmDateOfBirth"
                        type="date"
                        value={confirmDateOfBirth}
                        onChange={(e) => setConfirmDateOfBirth(e.target.value)}
                        disabled={isUpdating}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This must match your government-issued ID exactly
                      </p>
                    </div>
                  </div>

                  {hasDisplayName ? (
                    <div className="space-y-3">
                      <Button
                        onClick={handleNameConfirmed}
                        className="w-full"
                        size="lg"
                        disabled={isUpdating || !confirmDateOfBirth}
                      >
                        {isUpdating ? "Processing..." : "Yes, this is correct - Continue to Verification"}
                      </Button>

                      <Button
                        onClick={handleEditName}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update My Name
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-800 text-sm">
                          Your name is required for identity verification. Please update your profile first.
                        </p>
                      </div>

                      <Button
                        onClick={handleEditName}
                        className="w-full"
                        size="lg"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Add Your Name
                      </Button>
                    </div>
                  )}
                </>
              )}

              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                <strong>Important:</strong> Your name must match your government-issued ID exactly.
                This includes spelling, capitalization, and any hyphens or apostrophes.
              </div>
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
            userEmail={localUserData.email || ""}
            firstName={localUserData.authenticatedFirstName || localUserData.firstName || undefined}
            lastName={localUserData.authenticatedLastName || localUserData.lastName || undefined}
            dob={localUserData.authenticatedDateOfBirth || undefined}
            onVerificationComplete={handleVerificationComplete}
            onVerificationError={handleVerificationError}
          />
        </MedallionScriptLoader>

        {isUpdating && (
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
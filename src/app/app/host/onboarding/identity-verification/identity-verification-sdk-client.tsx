"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MedallionVerificationSDK } from "@/components/medallion-verification-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, User, Edit, Save, X, Loader2, AlertTriangle, XCircle, Clock, RefreshCw } from "lucide-react";
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
                <li>Name on ID doesn't exactly match your profile</li>
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Identity Verification</h1>
      </div>

      {/* Error Display */}
      {redirectError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            <strong>Error:</strong> {redirectError}
          </p>
          <button
            onClick={() => setRedirectError(null)}
            className="mt-2 text-xs text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Name Confirmation or Edit */}
      {showNameConfirmation && !localUserData.authenticatedFirstName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Confirm Your Identity Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showEditForm ? (
              <>
                <p className="text-sm text-gray-600">
                  Please enter your information exactly as it appears on your government-issued ID:
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editFirstName">Legal First Name</Label>
                      <Input
                        id="editFirstName"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editLastName">Legal Last Name</Label>
                      <Input
                        id="editLastName"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editMiddleName">Middle Name (optional)</Label>
                    <Input
                      id="editMiddleName"
                      value={editMiddleName}
                      onChange={(e) => setEditMiddleName(e.target.value)}
                      placeholder="Middle name (if shown on your ID)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Include this if your government ID shows a middle name
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="editDateOfBirth">Date of Birth</Label>
                  <Input
                    id="editDateOfBirth"
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => setEditDateOfBirth(e.target.value)}
                  />
                </div>

                {updateError && (
                  <div className="text-red-600 text-sm">{updateError}</div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleUpdateName}
                    disabled={isUpdatingName}
                    className="flex-1"
                  >
                    {isUpdatingName ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Information
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditForm(false)}
                    disabled={isUpdatingName}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Please confirm this information matches your government-issued ID exactly:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div><strong>Name:</strong> {localUserData.firstName} {localUserData.authenticatedMiddleName || ""} {localUserData.lastName}</div>
                  <div><strong>Email:</strong> {localUserData.email}</div>
                </div>

                <div>
                  <Label htmlFor="confirmDateOfBirth">Date of Birth</Label>
                  <Input
                    id="confirmDateOfBirth"
                    type="date"
                    value={confirmDateOfBirth}
                    onChange={(e) => setConfirmDateOfBirth(e.target.value)}
                  />
                </div>

                {updateError && (
                  <div className="text-red-600 text-sm">{updateError}</div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleConfirmName}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      'Confirm & Continue'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditForm(true)}
                    disabled={isUpdating}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medallion Verification Component */}
      {(localUserData.authenticatedFirstName || !showNameConfirmation) && (
        <MedallionVerificationSDK
          userEmail={localUserData.email || ""}
          firstName={localUserData.authenticatedFirstName || localUserData.firstName || ""}
          middleName={localUserData.authenticatedMiddleName || ""}
          lastName={localUserData.authenticatedLastName || localUserData.lastName || ""}
          dob={localUserData.authenticatedDateOfBirth || convertToDDMMYYYY(confirmDateOfBirth)}
          onVerificationComplete={(result) => {
            console.log('Verification completed:', result);
            // The webhook will update the status, so we can just refresh or redirect
            const targetUrl = redirectUrl || "/app/host/dashboard/overview";
            router.push(targetUrl);
          }}
          onVerificationError={(error) => {
            console.error('Verification error:', error);
            // Error is already handled in the component
          }}
        />
      )}
    </div>
  );
}
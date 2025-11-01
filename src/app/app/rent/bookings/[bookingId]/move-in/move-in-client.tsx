'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandButton } from '@/components/ui/brandButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, AlertCircle, Loader2, Home, RotateCcw } from 'lucide-react';
import { confirmMoveIn, reportMoveInIssue, resetMoveInStatus } from './_actions';

interface MoveInClientProps {
  bookingId: string;
  startDate: Date;
  listing: {
    title: string;
    address: string;
    city: string;
    state: string;
  };
  hasPendingPayments: boolean;
  existingResponse: {
    status: 'confirmed' | 'issue_reported';
    confirmedAt: Date | null;
    issueReportedAt: Date | null;
    issueNotes: string | null;
  } | null;
  isAdminDev?: boolean;
}

export default function MoveInClient({
  bookingId,
  startDate,
  listing,
  hasPendingPayments,
  existingResponse,
  isAdminDev = false,
}: MoveInClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'issue' | 'reset' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleConfirmMoveIn = async () => {
    setIsProcessing(true);
    setActionType('confirm');
    setMessage(null);

    try {
      const result = await confirmMoveIn(bookingId);
      if (result.success) {
        // Redirect immediately to booking page where user can see payment status
        router.push(`/app/rent/bookings/${bookingId}`);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to confirm move-in',
        });
      }
    } catch (error) {
      console.error('Error confirming move-in:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  const handleReportIssue = async () => {
    setIsProcessing(true);
    setActionType('issue');
    setMessage(null);

    try {
      const result = await reportMoveInIssue(bookingId);
      if (result.success) {
        // Redirect immediately to booking page
        router.push(`/app/rent/bookings/${bookingId}`);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to report issue',
        });
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  const handleResetMoveInStatus = async () => {
    setIsProcessing(true);
    setActionType('reset');
    setMessage(null);
    setShowResetDialog(false);

    try {
      const result = await resetMoveInStatus(bookingId);
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Move-in status reset successfully',
        });
        // Refresh the page to show updated state
        router.refresh();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to reset move-in status',
        });
      }
    } catch (error) {
      console.error('Error resetting move-in status:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // If user already responded, show confirmation message
  if (existingResponse) {
    return (
      <div className="w-full py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Move-In Status</h1>
          <p className="text-muted-foreground">
            {listing.title} • {listing.city}, {listing.state}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  existingResponse.status === 'confirmed'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}
              >
                {existingResponse.status === 'confirmed' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <CardTitle>
                  {existingResponse.status === 'confirmed'
                    ? 'Move-In Confirmed'
                    : 'Move-In Issue Reported'}
                </CardTitle>
                <CardDescription>
                  Submitted on{' '}
                  {new Date(
                    (existingResponse.confirmedAt ||
                      existingResponse.issueReportedAt)!
                  ).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingResponse.status === 'confirmed' ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Thank you for confirming your move-in! Your rent payments are
                  now scheduled for processing.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Your move-in issue has been reported. Your payments are on
                    hold and our support team will contact you shortly.
                  </AlertDescription>
                </Alert>
                {existingResponse.issueNotes && (
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h3 className="font-semibold mb-2 text-sm">Issue Details:</h3>
                    <p className="text-sm text-muted-foreground">
                      {existingResponse.issueNotes}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="pt-4 border-t">
              <BrandButton
                href={`/app/rent/bookings/${bookingId}`}
                className="w-full max-w-[400px] mx-auto"
              >
                View Booking Details
              </BrandButton>
            </div>
          </CardContent>
        </Card>

        {/* Admin Dev Reset Section */}
        {isAdminDev && (
          <Card className="mt-6 border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 text-sm">ADMIN DEV ONLY - Testing Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-300">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900 text-sm">
                  This section is only visible to admin_dev users. Use with caution - resetting will clear all move-in responses and reset payments to PENDING_MOVE_IN status.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <BrandButton
                  onClick={() => setShowResetDialog(true)}
                  disabled={isProcessing}
                  variant="destructive-outline"
                  className="max-w-[400px]"
                >
                  {isProcessing && actionType === 'reset' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Move-In Status
                    </>
                  )}
                </BrandButton>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Move-In Status?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all move-in tracking fields and set monthly rent payments back to PENDING_MOVE_IN status.
                This action is intended for testing purposes only.
                <br /><br />
                <strong>What will be reset:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Move-in confirmation/issue status</li>
                  <li>All move-in timestamps</li>
                  <li>Issue notes</li>
                  <li>All monthly rent payment statuses → PENDING_MOVE_IN</li>
                  <li>Payment authorization/capture timestamps</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetMoveInStatus}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? 'Resetting...' : 'Reset Move-In Status'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Show move-in confirmation form
  return (
    <div className="w-full py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Move-In Confirmation</h1>
        <p className="text-muted-foreground">
          {listing.title} • {listing.city}, {listing.state}
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Welcome to Your New Home!</CardTitle>
              <CardDescription>
                Move-in date: {new Date(startDate).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-base">
              We hope your move-in went smoothly! Please confirm below that you've successfully moved in so we can begin processing your rent payments.
            </p>
            <p className="text-base">
              If you experienced any issues during move-in, please let us know and we'll hold your payments while we work with you to resolve them.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Note: If we don't hear from you by the end of move-in day, we'll assume everything went well and process payments as scheduled.
            </p>
          </div>

          {hasPendingPayments && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                You have rent payments waiting to be processed. Confirming move-in will allow these payments to proceed as scheduled.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <BrandButton
              onClick={handleConfirmMoveIn}
              disabled={isProcessing}
              className="flex-1 h-auto py-4 max-w-[400px]"
              size="lg"
            >
              {isProcessing && actionType === 'confirm' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Yes, I've Successfully Moved In
                </>
              )}
            </BrandButton>

            <BrandButton
              onClick={handleReportIssue}
              disabled={isProcessing}
              variant="destructive-outline"
              className="flex-1 h-auto py-4 max-w-[400px]"
              size="lg"
            >
              {isProcessing && actionType === 'issue' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Reporting...
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 mr-2" />
                  I'm Having Issues with Move-In
                </>
              )}
            </BrandButton>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Need help? Contact support at support@matchbook.com
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Dev Reset Section */}
      {isAdminDev && (
        <Card className="mt-6 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 text-sm">ADMIN DEV ONLY - Testing Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-300">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900 text-sm">
                This section is only visible to admin_dev users. Use with caution - resetting will clear all move-in responses and reset payments to PENDING_MOVE_IN status.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <BrandButton
                onClick={() => setShowResetDialog(true)}
                disabled={isProcessing}
                variant="destructive-outline"
                className="max-w-[400px]"
              >
                {isProcessing && actionType === 'reset' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Move-In Status
                  </>
                )}
              </BrandButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Move-In Status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all move-in tracking fields and set monthly rent payments back to PENDING_MOVE_IN status.
              This action is intended for testing purposes only.
              <br /><br />
              <strong>What will be reset:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Move-in confirmation/issue status</li>
                <li>All move-in timestamps</li>
                <li>Issue notes</li>
                <li>All monthly rent payment statuses → PENDING_MOVE_IN</li>
                <li>Payment authorization/capture timestamps</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetMoveInStatus}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Resetting...' : 'Reset Move-In Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

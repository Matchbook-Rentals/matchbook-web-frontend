'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, ExternalLink, Home, Receipt } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PaymentSuccessPageProps {
  params: {
    matchId: string;
  };
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError('No session ID found');
        setIsProcessing(false);
        return;
      }

      try {
        // Get match data to determine the payment amount
        const matchResponse = await fetch(`/api/matches/${params.matchId}`);
        const matchData = await matchResponse.json();
        
        // Calculate payment amount (this should match the calculation in PaymentMethodSelector)
        const monthlyRent = matchData.monthlyRent || 0;
        const deposit = matchData.listing?.depositSize || 0;
        const petDeposit = matchData.listing?.petDeposit || 0;
        const amount = monthlyRent + deposit + petDeposit;

        const response = await fetch(`/api/matches/${params.matchId}/payment-setup-success`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            amount,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to process payment');
        }

        const result = await response.json();
        setPaymentResult(result);
        
        toast({
          title: "Payment Successful!",
          description: "Your lease payment has been completed successfully.",
        });
      } catch (error) {
        console.error('Payment processing error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        toast({
          title: "Error",
          description: "Failed to process payment",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [params.matchId, searchParams, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we confirm your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Processing Failed</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/platform/match/${params.matchId}/lease-signing`)}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/platform/dashboard')}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
            Payment Completed Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">
                Payment Processed Successfully
              </h3>
              <p className="text-green-800 text-sm">
                Your lease payment has been completed using your{' '}
                {paymentResult?.paymentMethodType === 'us_bank_account' ? 'bank account' : 'credit card'}.
                You should receive a receipt from Stripe via email shortly.
              </p>
            </div>
          </div>

          {paymentResult?.receiptUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Payment Receipt
              </h4>
              <p className="text-blue-800 text-sm mb-3">
                Stripe has generated a detailed receipt for your payment. You can view and download it anytime.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open(paymentResult.receiptUrl, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View & Download Receipt
              </Button>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🎉 Your Lease is Complete!</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• ✅ Lease agreement signed</li>
              <li>• ✅ Payment processed successfully</li>
              <li>• ✅ Move-in ready!</li>
              <li>• 📧 You&apos;ll receive move-in instructions via email</li>
              <li>• 🏠 Contact your landlord for any questions</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Keep your receipt for tax and rental records</li>
              <li>• Save your landlord&apos;s contact information</li>
              <li>• Review your lease agreement for move-in details</li>
              <li>• Set up any required utilities before move-in</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/platform/match/${params.matchId}/lease-signing`)}
              className="flex-1"
            >
              View Lease Details
            </Button>
            <Button
              onClick={() => router.push('/platform/dashboard')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
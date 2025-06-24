import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface PaymentSuccessPageProps {
  params: { matchId: string };
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Method Setup Complete!
                </h1>
                <p className="text-gray-600">
                  Your lease has been signed and payment method has been securely saved. 
                  The landlord can now complete their part of the process.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-blue-800 text-sm space-y-1 text-left">
                  <li>• Your payment method is securely stored with Stripe</li>
                  <li>• The landlord will sign the lease agreement</li>
                  <li>• Payment will be processed once both parties have signed</li>
                  <li>• You'll receive confirmation when everything is complete</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href="/platform/dashboard">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
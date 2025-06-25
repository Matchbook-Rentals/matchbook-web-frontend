'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Bell, 
  Home, 
  Calendar, 
  DollarSign,
  FileText,
  Shield,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { MatchWithRelations } from '@/types';

interface PendingHostSignatureClientProps {
  match: MatchWithRelations;
  matchId: string;
}

export function PendingHostSignatureClient({ match, matchId }: PendingHostSignatureClientProps) {
  const router = useRouter();

  // Calculate payment amount
  const calculatePaymentAmount = () => {
    const monthlyRent = match.monthlyRent || 0;
    const deposit = match.listing.depositSize || 0;
    const petDeposit = match.listing.petDeposit || 0;
    return monthlyRent + deposit + petDeposit;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/platform/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Great Job!</h1>
            </div>
            <p className="text-lg text-gray-600 mb-2">
              You&apos;ve completed all required steps for your lease at
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {match.listing.locationString}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Booking Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{match.listing.locationString}</h3>
                  <p className="text-sm text-gray-600">{match.listing.propertyType}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">${match.monthlyRent?.toLocaleString()}/month</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-medium">{new Date(match.trip.checkIn).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Completed Steps */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 text-green-600">✅ Completed Steps</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        Lease Signed by You
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        Payment Pre-Authorized (${calculatePaymentAmount().toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pending Steps */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 text-orange-600">⏳ Pending</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-600">
                        Host Signature Required
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Payment Processing
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Host Contact</h4>
                  <p className="text-sm text-gray-600">
                    {match.listing.user?.firstName} {match.listing.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{match.listing.user?.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Waiting for Host Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-blue-600" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Almost There! 🎉
                  </h3>
                  
                  <div className="max-w-md mx-auto space-y-4 text-gray-600">
                    <p>
                      You&apos;ve successfully completed your part of the lease agreement! 
                      Your payment method has been securely pre-authorized for <strong>${calculatePaymentAmount().toLocaleString()}</strong>.
                    </p>
                    
                    <p>
                      We&apos;ve notified <strong>{match.listing.user?.firstName} {match.listing.user?.lastName}</strong> 
                      that your lease is ready for their signature. Once they sign the lease, 
                      your booking will be officially confirmed and you&apos;ll receive a notification.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-medium text-blue-900 mb-1">Your Payment is Protected</p>
                          <p className="text-sm text-blue-800">
                            Your payment is pre-authorized but won&apos;t be charged until the host signs. 
                            If they don&apos;t sign within a reasonable time, the authorization will be canceled automatically.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (match.BoldSignLease?.id) {
                          window.open(`/api/leases/view?documentId=${match.BoldSignLease.id}`, '_blank');
                        }
                      }}
                      disabled={!match.BoldSignLease?.id}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Your Signed Lease
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/platform/dashboard')}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What Happens Next */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Host Reviews & Signs</h4>
                      <p className="text-sm text-gray-600">
                        {match.listing.user?.firstName} will review the lease and add their signature. 
                        They typically respond within 24-48 hours.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Payment Processed</h4>
                      <p className="text-sm text-gray-600">
                        Once both parties have signed, your pre-authorized payment will be automatically processed.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Booking Confirmed</h4>
                      <p className="text-sm text-gray-600">
                        You&apos;ll receive a confirmation notification and can start planning your move-in!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
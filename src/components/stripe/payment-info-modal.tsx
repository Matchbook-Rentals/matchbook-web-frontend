'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Shield, CheckCircle, Clock, DollarSign, X } from 'lucide-react';

interface PaymentInfoModalProps {
  matchId: string;
  paymentAmount?: number;
  paymentAuthorizedAt?: Date | null;
  paymentCapturedAt?: Date | null;
  stripePaymentMethodId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentInfoModal({
  matchId,
  paymentAmount,
  paymentAuthorizedAt,
  paymentCapturedAt,
  stripePaymentMethodId,
  isOpen,
  onClose
}: PaymentInfoModalProps) {
  const [paymentMethodDetails, setPaymentMethodDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stripePaymentMethodId) {
      fetchPaymentMethodDetails();
    }
  }, [isOpen, stripePaymentMethodId]);

  const fetchPaymentMethodDetails = async () => {
    if (!stripePaymentMethodId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/payment-method-details`);
      if (response.ok) {
        const data = await response.json();
        setPaymentMethodDetails(data.paymentMethod);
      }
    } catch (error) {
      console.error('Error fetching payment method details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatAmount = (amount?: number) => {
    if (!amount) return '$0';
    return `$${(amount / 100).toLocaleString()}`;
  };

  const getPaymentStatus = () => {
    if (paymentCapturedAt) return { text: 'Payment Captured', color: 'text-green-600', icon: CheckCircle };
    if (paymentAuthorizedAt) return { text: 'Pre-Authorized', color: 'text-blue-600', icon: Shield };
    if (stripePaymentMethodId) return { text: 'Payment Method Saved', color: 'text-yellow-600', icon: Clock };
    return { text: 'No Payment Method', color: 'text-gray-600', icon: CreditCard };
  };

  const status = getPaymentStatus();
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className={`w-5 h-5 ${status.color}`} />
                <span className={`font-medium ${status.color}`}>{status.text}</span>
              </div>
              {paymentAmount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">Amount: {formatAmount(paymentAmount)}</span>
                </div>
              )}
            </div>

            {/* Payment Method Details */}
            {stripePaymentMethodId && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Payment Method</h4>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-blue-700 text-sm">Loading payment method details...</span>
                  </div>
                ) : paymentMethodDetails?.card ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-white rounded flex items-center justify-center text-xs font-medium border">
                      {paymentMethodDetails.card.brand.toUpperCase()}
                    </div>
                    <span className="text-blue-700">•••• •••• •••• {paymentMethodDetails.card.last4}</span>
                  </div>
                ) : (
                  <span className="text-blue-700 text-sm">Payment method ID: ***{stripePaymentMethodId.slice(-4)}</span>
                )}
              </div>
            )}

            {/* Timeline */}
            {paymentAuthorizedAt && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Timeline</h4>
                <div className="space-y-1">
                  {paymentAuthorizedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">Authorized: {new Date(paymentAuthorizedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {paymentCapturedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Captured: {new Date(paymentCapturedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  ChevronDown, 
  RefreshCw, 
  FileSignature, 
  CreditCard, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MatchWithRelations } from '@/types';

interface AdminDebugPanelProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev: boolean;
  onReset?: () => void;
}

export function AdminDebugPanel({ match, matchId, isAdminDev, onReset }: AdminDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const { toast } = useToast();

  // Don't render if not admin dev
  if (!isAdminDev) return null;

  const handleReset = async (resetType: 'all' | 'tenant' | 'payment') => {
    const confirmMessages = {
      all: 'Reset ALL lease and payment data? This will clear signatures AND payment information.',
      tenant: 'Reset TENANT signature only? Landlord signature and payment data will be preserved.',
      payment: 'Reset payment data only? Lease signatures will be preserved.'
    };

    if (!confirm(confirmMessages[resetType])) return;

    setIsResetting(resetType);

    try {
      const response = await fetch(`/api/matches/${matchId}/admin-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetType, isAdminDev: true })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reset failed');
      }

      const result = await response.json();
      
      toast({
        title: "Reset Successful",
        description: `${result.message}. Page will refresh...`,
      });

      // Refresh after a short delay
      setTimeout(() => {
        if (onReset) {
          onReset();
        } else {
          window.location.reload();
        }
      }, 1500);

    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : 'Failed to reset data',
        variant: "destructive",
      });
    } finally {
      setIsResetting(null);
    }
  };

  // Helper to format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString();
  };

  // Determine current state
  const hasLeaseSignatures = !!match.tenantSignedAt || !!match.landlordSignedAt;
  const hasPaymentData = !!match.stripePaymentMethodId || !!match.stripePaymentIntentId;
  const isFullyCompleted = !!match.tenantSignedAt && !!match.landlordSignedAt && !!match.paymentCapturedAt;

  return (
    <Card className="border-orange-300 bg-orange-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-lg">Admin Debug Panel</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-orange-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Current State Display */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Current State</h3>
              
              {/* Lease Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileSignature className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Lease Signatures:</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {match.tenantSignedAt ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-gray-700">
                      Tenant: {formatDate(match.tenantSignedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {match.landlordSignedAt ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-gray-700">
                      Landlord: {formatDate(match.landlordSignedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Payment Status:</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {match.stripePaymentMethodId ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-gray-700">
                      Payment Method: {match.stripePaymentMethodId ? `${match.stripePaymentMethodId.substring(0, 20)}...` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {match.stripePaymentIntentId ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-gray-700">
                      Payment Intent: {match.stripePaymentIntentId ? `${match.stripePaymentIntentId.substring(0, 20)}...` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {match.paymentAuthorizedAt ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-gray-700">
                      Authorized: {formatDate(match.paymentAuthorizedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {match.paymentCapturedAt ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-gray-700">
                      Captured: {formatDate(match.paymentCapturedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall Status */}
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2">
                  {isFullyCompleted ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Fully Completed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">In Progress</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Reset Actions */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Reset Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReset('all')}
                  disabled={!!isResetting || (!hasLeaseSignatures && !hasPaymentData)}
                  className="flex items-center gap-2"
                >
                  {isResetting === 'all' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Reset Everything
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset('tenant')}
                  disabled={!!isResetting || !match.tenantSignedAt}
                  className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {isResetting === 'tenant' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSignature className="w-4 h-4" />
                  )}
                  Reset Tenant Signature
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset('payment')}
                  disabled={!!isResetting || !hasPaymentData}
                  className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {isResetting === 'payment' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Reset Payment Only
                </Button>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">Debug Mode Only</p>
                  <p className="mt-1">These controls are only available in development mode with admin privileges. They will not appear in production.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
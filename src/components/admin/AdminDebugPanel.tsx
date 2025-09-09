'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  ChevronDown, 
  RefreshCw, 
  FileSignature, 
  CreditCard, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  X,
  PawPrint,
  Calendar,
  Save
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MatchWithRelations } from '@/types';

interface AdminDebugPanelProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev: boolean;
  onReset?: () => void;
  onHidePaymentMethods?: () => void;
}

export function AdminDebugPanel({ match, matchId, isAdminDev, onReset, onHidePaymentMethods }: AdminDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Pet fee editing state
  const [editingPetFees, setEditingPetFees] = useState(false);
  const [petRentValue, setPetRentValue] = useState(match.petRent?.toString() || '0');
  const [petDepositValue, setPetDepositValue] = useState(match.petDeposit?.toString() || '0');
  const [numPetsValue, setNumPetsValue] = useState(match.trip.numPets?.toString() || '0');
  
  // Trip dates editing state
  const [editingTripDates, setEditingTripDates] = useState(false);
  const [startDateValue, setStartDateValue] = useState(
    match.trip.startDate ? new Date(match.trip.startDate).toISOString().split('T')[0] : ''
  );
  const [endDateValue, setEndDateValue] = useState(
    match.trip.endDate ? new Date(match.trip.endDate).toISOString().split('T')[0] : ''
  );

  // Don't render if not admin dev or if hidden
  if (!isAdminDev || isHidden) return null;

  const handleUpdatePetFees = async () => {
    setIsResetting('updatePetFees');
    
    try {
      const response = await fetch(`/api/matches/${matchId}/admin-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resetType: 'updatePetFees',
          isAdminDev: true,
          petRent: parseInt(petRentValue) || 0,
          petDeposit: parseInt(petDepositValue) || 0,
          numPets: parseInt(numPetsValue) || 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      const result = await response.json();
      
      toast({
        title: "Pet Fees Updated",
        description: `Pet rent: $${petRentValue}/pet, Pet deposit: $${petDepositValue}/pet, Num pets: ${numPetsValue}`,
      });
      
      setEditingPetFees(false);
      
      // Refresh after a short delay
      setTimeout(() => {
        if (onReset) {
          onReset();
        } else {
          window.location.reload();
        }
      }, 1500);
      
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update pet fees',
        variant: "destructive",
      });
    } finally {
      setIsResetting(null);
    }
  };

  const handleUpdateTripDates = async () => {
    setIsResetting('updateTripDates');
    
    try {
      const response = await fetch(`/api/matches/${matchId}/admin-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resetType: 'updateTripDates',
          isAdminDev: true,
          startDate: startDateValue,
          endDate: endDateValue
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      const result = await response.json();
      
      toast({
        title: "Trip Dates Updated",
        description: `Start: ${startDateValue}, End: ${endDateValue}`,
      });
      
      setEditingTripDates(false);
      
      // Refresh after a short delay
      setTimeout(() => {
        if (onReset) {
          onReset();
        } else {
          window.location.reload();
        }
      }, 1500);
      
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update trip dates',
        variant: "destructive",
      });
    } finally {
      setIsResetting(null);
    }
  };

  const handleReset = async (resetType: 'all' | 'tenant' | 'payment' | 'paymentMethod') => {
    const confirmMessages = {
      all: 'Reset ALL lease and payment data? This will clear signatures AND payment information.',
      tenant: 'Reset TENANT signature only? Landlord signature and payment data will be preserved.',
      payment: 'Reset payment data only? Lease signatures will be preserved.',
      paymentMethod: 'Clear payment method only? This will show the first-time payment selection UI.'
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
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors relative">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-lg">Admin Debug Panel</span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronDown className={`w-5 h-5 text-orange-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHidden(true);
                  }}
                  className="h-auto p-1 hover:bg-orange-200"
                  title="Hide panel for this session"
                >
                  <X className="w-4 h-4 text-orange-700" />
                </Button>
              </div>
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset('paymentMethod')}
                  disabled={!!isResetting || !match.stripePaymentMethodId}
                  className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {isResetting === 'paymentMethod' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Clear Payment Method
                </Button>

                {onHidePaymentMethods && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onHidePaymentMethods}
                    className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    <CreditCard className="w-4 h-4" />
                    Hide Payment Methods (UI Only)
                  </Button>
                )}
              </div>
            </div>

            {/* Pet Fee Controls */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <PawPrint className="w-4 h-4" />
                  Pet Fee Controls
                </h3>
                {!editingPetFees && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPetFees(true)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                )}
              </div>
              
              {editingPetFees ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Number of Pets</label>
                      <Input
                        type="number"
                        min="0"
                        value={numPetsValue}
                        onChange={(e) => setNumPetsValue(e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Pet Rent (per pet)</label>
                      <Input
                        type="number"
                        value={petRentValue}
                        onChange={(e) => setPetRentValue(e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Pet Deposit (per pet)</label>
                      <Input
                        type="number"
                        value={petDepositValue}
                        onChange={(e) => setPetDepositValue(e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {parseInt(numPetsValue) > 0 && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <p className="font-medium">Calculated Totals:</p>
                      <p>Total pet rent: ${(parseInt(petRentValue) || 0) * (parseInt(numPetsValue) || 0)}/month</p>
                      <p>Total pet deposit: ${(parseInt(petDepositValue) || 0) * (parseInt(numPetsValue) || 0)}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdatePetFees}
                      disabled={!!isResetting}
                      className="flex items-center gap-2"
                    >
                      {isResetting === 'updatePetFees' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPetFees(false);
                        setPetRentValue(match.petRent?.toString() || '0');
                        setPetDepositValue(match.petDeposit?.toString() || '0');
                        setNumPetsValue(match.trip.numPets?.toString() || '0');
                      }}
                      disabled={!!isResetting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">Number of Pets: {match.trip.numPets || 0}</p>
                  <p className="text-gray-700">Pet Rent: ${match.petRent || 0}/pet/month</p>
                  <p className="text-gray-700">Pet Deposit: ${match.petDeposit || 0}/pet</p>
                  {match.trip.numPets > 0 && (
                    <div className="text-gray-500 text-xs mt-2 space-y-1">
                      <p>Total pet rent: ${(match.petRent || 0) * match.trip.numPets}/month</p>
                      <p>Total pet deposit: ${(match.petDeposit || 0) * match.trip.numPets}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trip Dates Controls */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Trip Dates Controls
                </h3>
                {!editingTripDates && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTripDates(true)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                )}
              </div>
              
              {editingTripDates ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Start Date</label>
                      <Input
                        type="date"
                        value={startDateValue}
                        onChange={(e) => setStartDateValue(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">End Date</label>
                      <Input
                        type="date"
                        value={endDateValue}
                        onChange={(e) => setEndDateValue(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {startDateValue && endDateValue && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <p>Trip duration: {Math.ceil((new Date(endDateValue).getTime() - new Date(startDateValue).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                      <p>Proration info will be calculated based on these dates</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateTripDates}
                      disabled={!!isResetting}
                      className="flex items-center gap-2"
                    >
                      {isResetting === 'updateTripDates' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTripDates(false);
                        setStartDateValue(
                          match.trip.startDate ? new Date(match.trip.startDate).toISOString().split('T')[0] : ''
                        );
                        setEndDateValue(
                          match.trip.endDate ? new Date(match.trip.endDate).toISOString().split('T')[0] : ''
                        );
                      }}
                      disabled={!!isResetting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">Start: {formatDate(match.trip.startDate)}</p>
                  <p className="text-gray-700">End: {formatDate(match.trip.endDate)}</p>
                  {match.trip.startDate && match.trip.endDate && (
                    <p className="text-gray-500 text-xs mt-2">
                      Duration: {Math.ceil((new Date(match.trip.endDate).getTime() - new Date(match.trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  )}
                </div>
              )}
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
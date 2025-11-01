'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  getMigrationBookings,
  attachPaymentMethodToPayments,
  createSecurityDepositRecord,
  getSecurityDepositTransaction,
  migratePaymentsToPendingMoveIn,
} from './_actions';

interface MigrationBooking {
  id: string;
  matchId: string;
  startDate: Date;
  createdAt: Date;
  monthlyRent: number | null;
  match: {
    id: string;
    stripePaymentMethodId: string | null;
    stripePaymentIntentId: string | null;
    paymentAmount: number | null;
  } | null;
  rentPayments: Array<{
    id: string;
    amount: number;
    dueDate: Date;
    isPaid: boolean;
    stripePaymentMethodId: string | null;
    charges: Array<{
      id: string;
      category: string;
      amount: number;
    }>;
  }>;
  needsPaymentMethod: boolean;
  paymentsWithoutMethodCount: number;
  needsChargeItemization: boolean;
  paymentsWithoutChargesCount: number;
  hasSecurityDepositRecord: boolean;
  needsPendingMoveInMigration: boolean;
  paymentsNotPendingMoveInCount: number;
}

export default function PaymentMigrationPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<MigrationBooking[]>([]);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'payment-method' | 'security-deposit' | 'pending-move-in' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<{
    bookingId: string;
    data: any;
  } | null>(null);
  const [loadingTransaction, setLoadingTransaction] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (user) {
        const userRole = user.publicMetadata?.role as string;
        const hasAdminAccess = userRole?.includes('admin');
        if (!hasAdminAccess) {
          router.push('/unauthorized');
          return;
        }
      }
      await loadBookings();
    };
    checkAuth();
  }, [user, router]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await getMigrationBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load bookings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachPaymentMethod = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    setActionType('payment-method');
    setMessage(null);

    try {
      const result = await attachPaymentMethodToPayments(bookingId);
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Payment method attached successfully',
        });
        await loadBookings(); // Reload to show updated status
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to attach payment method',
        });
      }
    } catch (error) {
      console.error('Error attaching payment method:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setProcessingBookingId(null);
      setActionType(null);
    }
  };

  const handleCreateSecurityDeposit = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    setActionType('security-deposit');
    setMessage(null);

    try {
      const result = await createSecurityDepositRecord(bookingId);
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Security deposit record created',
        });
        await loadBookings(); // Reload to show updated status
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to create security deposit record',
        });
      }
    } catch (error) {
      console.error('Error creating security deposit:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setProcessingBookingId(null);
      setActionType(null);
    }
  };

  const handleMigrateToPendingMoveIn = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    setActionType('pending-move-in');
    setMessage(null);

    try {
      const result = await migratePaymentsToPendingMoveIn(bookingId);
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Payments migrated to PENDING_MOVE_IN',
        });
        await loadBookings(); // Reload to show updated status
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to migrate payments',
        });
      }
    } catch (error) {
      console.error('Error migrating to pending move-in:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setProcessingBookingId(null);
      setActionType(null);
    }
  };

  const handleViewTransaction = async (bookingId: string) => {
    setLoadingTransaction(bookingId);
    try {
      const result = await getSecurityDepositTransaction(bookingId);
      if (result.success) {
        setViewingTransaction({
          bookingId,
          data: result.paymentIntent,
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to fetch transaction',
        });
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setLoadingTransaction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payment Migration Tool</h1>
        <p className="text-muted-foreground">
          Migrate existing bookings to the new itemized payment charge system
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No bookings found
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-2">Booking {booking.id}</CardTitle>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Match ID: {booking.matchId}</div>
                      <div>
                        Created: {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        Start Date: {new Date(booking.startDate).toLocaleDateString()}
                      </div>
                      {booking.monthlyRent && (
                        <div>Monthly Rent: ${booking.monthlyRent}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!booking.needsPaymentMethod ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Payment Methods OK
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Missing Payment Methods
                      </Badge>
                    )}
                    {booking.hasSecurityDepositRecord ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Has Deposit Record
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Missing Deposit Record
                      </Badge>
                    )}
                    {!booking.needsPendingMoveInMigration ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Pending Move-In Status OK
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Needs Move-In Migration
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Match Details */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h3 className="font-semibold mb-2">Match Payment Details</h3>
                  <div className="text-sm space-y-1">
                    <div>
                      Payment Method ID:{' '}
                      {booking.match?.stripePaymentMethodId ? (
                        <code className="bg-white px-2 py-0.5 rounded">
                          {booking.match.stripePaymentMethodId}
                        </code>
                      ) : (
                        <span className="text-red-600">None</span>
                      )}
                    </div>
                    <div>
                      Payment Intent ID:{' '}
                      {booking.match?.stripePaymentIntentId ? (
                        <code className="bg-white px-2 py-0.5 rounded">
                          {booking.match.stripePaymentIntentId}
                        </code>
                      ) : (
                        <span className="text-red-600">None</span>
                      )}
                    </div>
                    {booking.match?.paymentAmount && (
                      <div>Payment Amount: ${booking.match.paymentAmount}</div>
                    )}
                  </div>
                </div>

                {/* Rent Payments List */}
                <div>
                  <h3 className="font-semibold mb-2">
                    Rent Payments ({booking.rentPayments.length})
                  </h3>
                  <div className="space-y-2">
                    {booking.rentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border rounded p-3 text-sm bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-mono text-xs text-muted-foreground">
                              {payment.id}
                            </div>
                            <div>
                              Due: {new Date(payment.dueDate).toLocaleDateString()} •{' '}
                              Amount: ${payment.amount}
                            </div>
                            <div>
                              Status:{' '}
                              {payment.isPaid ? (
                                <Badge variant="outline" className="text-green-600">
                                  Paid
                                </Badge>
                              ) : (
                                <Badge variant="outline">Unpaid</Badge>
                              )}
                            </div>
                            <div>
                              Payment Method:{' '}
                              {payment.stripePaymentMethodId ? (
                                <span className="text-green-600">✓ Attached</span>
                              ) : (
                                <span className="text-red-600">✗ Missing</span>
                              )}
                            </div>
                            <div>
                              Charges: {payment.charges.length}{' '}
                              {payment.charges.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  (
                                  {payment.charges
                                    .map((c) => c.category)
                                    .join(', ')}
                                  )
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction Viewer */}
                {viewingTransaction?.bookingId === booking.id && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Stripe Payment Intent</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingTransaction(null)}
                      >
                        Close
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">ID:</span>{' '}
                        <code className="bg-white px-2 py-0.5 rounded">
                          {viewingTransaction.data.id}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> $
                        {(viewingTransaction.data.amount / 100).toFixed(2)}{' '}
                        {viewingTransaction.data.currency.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge variant="outline">
                          {viewingTransaction.data.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {new Date(
                          viewingTransaction.data.created * 1000
                        ).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Payment Method:</span>{' '}
                        <code className="bg-white px-2 py-0.5 rounded text-xs">
                          {viewingTransaction.data.payment_method || 'N/A'}
                        </code>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="font-medium mb-1">Metadata:</div>
                        <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(
                            viewingTransaction.data.metadata,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Migration Actions */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAttachPaymentMethod(booking.id)}
                      disabled={
                        !booking.needsPaymentMethod ||
                        !booking.match?.stripePaymentMethodId ||
                        processingBookingId === booking.id
                      }
                      className="flex-1"
                    >
                      {processingBookingId === booking.id &&
                      actionType === 'payment-method' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Attaching...
                        </>
                      ) : (
                        'Attach Payment Method to Payments'
                      )}
                    </Button>

                    <Button
                      onClick={() => handleViewTransaction(booking.id)}
                      disabled={
                        !booking.match?.stripePaymentIntentId ||
                        loadingTransaction === booking.id
                      }
                      variant="outline"
                      className="flex-1"
                    >
                      {loadingTransaction === booking.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'See Security Deposit Transaction'
                      )}
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleCreateSecurityDeposit(booking.id)}
                    disabled={
                      booking.hasSecurityDepositRecord ||
                      !booking.match?.stripePaymentIntentId ||
                      processingBookingId === booking.id
                    }
                    variant="secondary"
                    className="w-full"
                  >
                    {processingBookingId === booking.id &&
                    actionType === 'security-deposit' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Security Deposit Record'
                    )}
                  </Button>

                  <Button
                    onClick={() => handleMigrateToPendingMoveIn(booking.id)}
                    disabled={
                      !booking.needsPendingMoveInMigration ||
                      processingBookingId === booking.id
                    }
                    variant="secondary"
                    className="w-full"
                  >
                    {processingBookingId === booking.id &&
                    actionType === 'pending-move-in' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      'Migrate to Pending Move-In'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

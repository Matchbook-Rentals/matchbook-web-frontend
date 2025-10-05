'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getTestableBookings, sendStripeWebhookEvent, TestableBooking } from './_actions';
import { useToast } from '@/components/ui/use-toast';

const ACH_FAILURE_CODES = [
  { code: 'R01', label: 'R01 - Insufficient Funds' },
  { code: 'R02', label: 'R02 - Account Closed' },
  { code: 'R03', label: 'R03 - No Account/Unable to Locate' },
  { code: 'R07', label: 'R07 - Authorization Revoked by Customer' },
  { code: 'R10', label: 'R10 - Customer Advises Unauthorized' },
  { code: 'R29', label: 'R29 - Corporate Customer Advises Not Authorized' },
];

export default function StripeWebhookTester() {
  const [bookings, setBookings] = useState<TestableBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<TestableBooking | null>(null);
  const [eventType, setEventType] = useState<string>('');
  const [failureCode, setFailureCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBookings, setIsFetchingBookings] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsFetchingBookings(true);
    try {
      const data = await getTestableBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive'
      });
    } finally {
      setIsFetchingBookings(false);
    }
  };

  const handleSendWebhook = async () => {
    if (!selectedBooking || !eventType || !selectedBooking.match) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select a booking and event type',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const result = await sendStripeWebhookEvent({
        matchId: selectedBooking.match.id,
        eventType: eventType as any,
        failureCode: eventType === 'payment_intent.payment_failed' ? failureCode : undefined,
        failureMessage: eventType === 'payment_intent.payment_failed'
          ? ACH_FAILURE_CODES.find(fc => fc.code === failureCode)?.label
          : undefined
      });

      setResponse(result);

      if (result.success) {
        toast({
          title: 'Webhook Sent Successfully',
          description: `Event ${eventType} processed`,
        });
        // Reload bookings to see updated status
        await loadBookings();
      } else {
        toast({
          title: 'Webhook Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to send webhook event',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'confirmed': { variant: 'default', label: 'Confirmed' },
      'pending_payment': { variant: 'secondary', label: 'Pending Payment' },
      'payment_failed': { variant: 'destructive', label: 'Payment Failed' },
      'reserved': { variant: 'outline', label: 'Reserved' },
    };

    const config = variants[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">-</Badge>;

    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      'processing': { variant: 'secondary', icon: AlertCircle },
      'captured': { variant: 'default', icon: CheckCircle },
      'settled': { variant: 'default', icon: CheckCircle },
      'failed': { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status] || { variant: 'outline' as const, icon: null };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Stripe Webhook Tester
          </CardTitle>
          <CardDescription>
            Test Stripe webhook events against real bookings and payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Selection Table */}
          <div>
            <Label className="text-base font-semibold mb-3 block">1. Select Booking</Label>
            {isFetchingBookings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Renter</TableHead>
                      <TableHead>Listing</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className={selectedBooking?.id === booking.id ? 'bg-muted' : ''}
                      >
                        <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          {booking.user.firstName} {booking.user.lastName}
                        </TableCell>
                        <TableCell>{booking.listing.title}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={selectedBooking?.id === booking.id ? 'default' : 'outline'}
                            onClick={() => setSelectedBooking(booking)}
                          >
                            {selectedBooking?.id === booking.id ? 'Selected' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Event Type Selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">2. Select Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose webhook event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment_intent.processing">
                  payment_intent.processing (ACH initiated)
                </SelectItem>
                <SelectItem value="payment_intent.succeeded">
                  payment_intent.succeeded (Payment succeeded)
                </SelectItem>
                <SelectItem value="payment_intent.payment_failed">
                  payment_intent.payment_failed (Payment failed)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Failure Code Selection (conditional) */}
          {eventType === 'payment_intent.payment_failed' && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">3. Select Failure Code</Label>
              <Select value={failureCode} onValueChange={setFailureCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose ACH return code" />
                </SelectTrigger>
                <SelectContent>
                  {ACH_FAILURE_CODES.map(fc => (
                    <SelectItem key={fc.code} value={fc.code}>
                      {fc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Send Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSendWebhook}
              disabled={!selectedBooking || !eventType || isLoading || (eventType === 'payment_intent.payment_failed' && !failureCode)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Webhook...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Send Webhook Event
                </>
              )}
            </Button>
          </div>

          {/* Response Display */}
          {response && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Response</Label>
              <div className={`p-4 rounded-lg border ${response.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {response.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium mb-2">
                      {response.success ? 'Webhook sent successfully' : 'Webhook failed'}
                    </p>
                    {response.error && (
                      <p className="text-sm text-red-600">{response.error}</p>
                    )}
                    {response.event && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium cursor-pointer">View Event JSON</summary>
                        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-96">
                          {JSON.stringify(response.event, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

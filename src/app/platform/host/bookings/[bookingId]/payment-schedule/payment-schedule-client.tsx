"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Clock, AlertCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface RentPayment {
  id: string;
  bookingId: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  stripePaymentMethodId: string | null;
  paymentAuthorizedAt: Date | null;
  paymentCapturedAt: Date | null;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BookingWithPayments {
  id: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number | null;
  listing: {
    title: string;
    streetAddress1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  rentPayments: RentPayment[];
}

interface PaymentScheduleClientProps {
  booking: BookingWithPayments;
}

export default function PaymentScheduleClient({ booking }: PaymentScheduleClientProps) {
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const getPaymentStatus = (payment: RentPayment) => {
    if (payment.isPaid && payment.paymentCapturedAt) {
      return {
        label: "Paid",
        variant: "success" as const,
        icon: <Check className="h-4 w-4" />
      };
    }
    
    if (payment.failureReason && payment.retryCount > 0) {
      return {
        label: "Failed",
        variant: "destructive" as const,
        icon: <X className="h-4 w-4" />
      };
    }
    
    if (payment.paymentAuthorizedAt && !payment.isPaid) {
      const dueDate = new Date(payment.dueDate);
      const now = new Date();
      
      if (now > dueDate) {
        return {
          label: "Overdue",
          variant: "warning" as const,
          icon: <AlertCircle className="h-4 w-4" />
        };
      }
      
      return {
        label: "Scheduled",
        variant: "secondary" as const,
        icon: <Clock className="h-4 w-4" />
      };
    }
    
    return {
      label: "Not Authorized",
      variant: "outline" as const,
      icon: <AlertCircle className="h-4 w-4" />
    };
  };

  const fullAddress = `${booking.listing.streetAddress1}, ${booking.listing.city}, ${booking.listing.state} ${booking.listing.postalCode}`;
  const guestName = `${booking.user.firstName} ${booking.user.lastName}`;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>

        <h1 className="text-3xl font-bold mb-2">Payment Schedule</h1>
        <div className="text-gray-600">
          <p className="text-lg">{booking.listing.title}</p>
          <p>{fullAddress}</p>
          <p className="mt-2">Guest: {guestName} ({booking.user.email})</p>
          <p>Lease Period: {formatDateShort(booking.startDate)} - {formatDateShort(booking.endDate)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Rent Payment Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pre-authorized</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Failure Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {booking.rentPayments.map((payment) => {
                const status = getPaymentStatus(payment);
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {formatDateShort(payment.dueDate)}
                    </TableCell>
                    <TableCell>${payment.amount}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paymentAuthorizedAt ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" />
                          {formatDate(payment.paymentAuthorizedAt)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <X className="h-4 w-4" />
                          Not authorized
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{payment.retryCount}</TableCell>
                    <TableCell>
                      {payment.paymentCapturedAt ? formatDate(payment.paymentCapturedAt) : "-"}
                    </TableCell>
                    <TableCell>
                      {payment.failureReason ? (
                        <span className="text-red-600 text-sm">{payment.failureReason}</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {booking.rentPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No rent payments scheduled for this booking.
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Monthly Rent</p>
                <p className="text-2xl font-bold">${booking.monthlyRent || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Scheduled Payments</p>
                <p className="text-2xl font-bold">{booking.rentPayments.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">
                  ${booking.rentPayments.reduce((sum, payment) => sum + payment.amount, 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
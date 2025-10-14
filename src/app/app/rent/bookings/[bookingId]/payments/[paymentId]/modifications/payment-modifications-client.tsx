"use client";

import React from "react";
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Modification {
  id: string;
  status: string;
  requestorName: string;
  requestorImage: string;
  recipientName: string;
  recipientImage: string;
  originalAmount: string;
  originalDueDate: string;
  newAmount: string;
  newDueDate: string;
  reason: string | null;
  requestedAt: string;
  viewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  isRequestor: boolean;
}

interface PaymentModificationsClientProps {
  paymentData: {
    paymentId: string;
    originalAmount: string;
    originalDueDate: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyImage: string;
  };
  modifications: Modification[];
  bookingId: string;
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return (
        <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="bg-green-50 text-green-600 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="bg-red-50 text-red-600 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200">{status}</Badge>;
  }
};

export default function PaymentModificationsClient({
  paymentData,
  modifications,
  bookingId
}: PaymentModificationsClientProps) {
  const router = useRouter();

  const handleBackToBooking = () => {
    router.push(`/app/rent/bookings/${bookingId}`);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={handleBackToBooking}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Booking
        </Button>

        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Payment Modification History
          </h2>
          <p className="text-gray-600 mt-1">
            View all modification requests for this payment
          </p>
        </div>
      </div>

      {/* Payment Details Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <img
              src={paymentData.propertyImage}
              alt={paymentData.propertyTitle}
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-800">
                {paymentData.propertyTitle}
              </h3>
              <p className="text-sm text-gray-600">{paymentData.propertyAddress}</p>
              <div className="mt-2 flex gap-4">
                <div>
                  <span className="text-xs text-gray-500">Amount: </span>
                  <span className="text-sm font-medium">{paymentData.originalAmount}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Due Date: </span>
                  <span className="text-sm font-medium">{paymentData.originalDueDate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modifications Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Modification Requests ({modifications.length})
        </h3>

        {modifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No modification requests found for this payment.</p>
            </CardContent>
          </Card>
        ) : (
          modifications.map((mod) => (
            <Card key={mod.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={mod.requestorImage} alt={mod.requestorName} />
                      <AvatarFallback>{mod.requestorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800">
                        {mod.requestorName}
                        {mod.isRequestor && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requested modification on {mod.requestedAt}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(mod.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Original</p>
                    <p className="font-medium">{mod.originalAmount}</p>
                    <p className="text-sm text-gray-600">Due: {mod.originalDueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Requested Change</p>
                    <p className="font-medium text-teal-600">{mod.newAmount}</p>
                    <p className="text-sm text-gray-600">Due: {mod.newDueDate}</p>
                  </div>
                </div>

                {mod.reason && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Reason</p>
                    <p className="text-sm text-gray-700">{mod.reason}</p>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                  {mod.viewedAt && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>Viewed on {mod.viewedAt}</span>
                    </div>
                  )}
                  {mod.approvedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Approved on {mod.approvedAt}</span>
                    </div>
                  )}
                  {mod.rejectedAt && (
                    <div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Rejected on {mod.rejectedAt}</span>
                      </div>
                      {mod.rejectionReason && (
                        <p className="ml-6 mt-1 text-gray-700">
                          Reason: {mod.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

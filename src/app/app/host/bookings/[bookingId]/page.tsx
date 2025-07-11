import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs";
import { getBooking } from "@/app/actions/bookings";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, DollarSign } from "lucide-react";

interface BookingDetailPageProps {
  params: {
    bookingId: string;
  };
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { userId } = auth();
  
  if (!userId) {
    notFound();
  }

  // Fetch the booking with all related data
  const booking = await getBooking(params.bookingId);

  if (!booking) {
    notFound();
  }

  // Format date range
  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
    const end = endDate.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
    return `${start} - ${end}`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className={HOST_PAGE_STYLE}>
      <HostPageTitle 
        title="Booking Details" 
        subtitle={`Booking ${booking.id}`} 
      />
      
      <div className="space-y-6">
        {/* Booking Status and Dates */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Booking Information</h2>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Booking Period</p>
                  <p className="font-medium">{formatDateRange(booking.startDate, booking.endDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="font-medium">${booking.monthlyRent?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guest Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Guest Information</h3>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Guest Details</p>
                <p className="text-sm text-gray-600">Guest ID: {booking.userId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Property Information</h3>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Property Details</p>
                <p className="text-sm text-gray-600">Listing ID: {booking.listingId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        {booking.totalPrice && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className="font-medium text-xl">${booking.totalPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="font-medium text-xl">${booking.monthlyRent?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
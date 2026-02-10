import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Car, Wifi, FileText, MapPin, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import RenterNavbar from "@/components/renter-navbar";

interface MoveInInstructionsPageProps {
  params: {
    bookingId: string;
  };
}

function formatAddress(listing: any): string {
  const parts = [
    listing.streetAddress1,
    listing.city,
    listing.state,
    listing.postalCode
  ].filter(Boolean);
  return parts.join(', ');
}

export default async function MoveInInstructionsPage({ params }: MoveInInstructionsPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user data for navbar
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      email: true,
    }
  });

  // Fetch booking with listing details
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      listing: {
        select: {
          title: true,
          streetAddress1: true,
          city: true,
          state: true,
          postalCode: true,
          imageSrc: true,
          moveInPropertyAccess: true,
          moveInParkingInfo: true,
          moveInWifiInfo: true,
          moveInOtherNotes: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            }
          }
        }
      }
    }
  });

  // Verify renter owns the booking
  if (!booking || booking.userId !== userId) {
    redirect("/app/rent/bookings");
  }

  const host = booking.listing.user;
  const hostName = host.fullName || `${host.firstName || ''} ${host.lastName || ''}`.trim() || 'Your host';

  const instructions = [
    {
      icon: Home,
      title: "Property Access",
      content: booking.listing.moveInPropertyAccess,
      emptyMessage: "No property access instructions provided yet."
    },
    {
      icon: Car,
      title: "Parking",
      content: booking.listing.moveInParkingInfo,
      emptyMessage: "No parking information provided yet."
    },
    {
      icon: Wifi,
      title: "WiFi",
      content: booking.listing.moveInWifiInfo,
      emptyMessage: "No WiFi information provided yet."
    },
    {
      icon: FileText,
      title: "Other Notes",
      content: booking.listing.moveInOtherNotes,
      emptyMessage: "No additional notes provided yet."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <RenterNavbar
        userId={userId}
        user={user}
        isSignedIn={!!userId}
      />
      <div className="max-w-[800px] mx-auto px-6 pb-8">
        {/* Back Button */}
        <Link href={`/app/rent/booking/${params.bookingId}`}>
          <Button
            variant="outline"
            className="mt-6 mb-6 border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Booking
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Move-In Instructions
          </h1>
          <p className="text-gray-600">
            Everything you need to know for your move-in
          </p>
        </div>

        {/* Property Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">{booking.listing.title}</div>
                <div className="text-gray-600 text-sm">{formatAddress(booking.listing)}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Move-In Date</div>
                <div className="text-gray-600 text-sm">
                  {format(new Date(booking.startDate), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Host Contact</div>
                <div className="text-gray-600 text-sm">{hostName}</div>
                {host.phoneNumber && (
                  <div className="text-gray-600 text-sm">{host.phoneNumber}</div>
                )}
                <div className="text-gray-600 text-sm">{host.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Cards */}
        <div className="space-y-6">
          {instructions.map((instruction, index) => {
            const Icon = instruction.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-5 h-5 text-teal-600" />
                    {instruction.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {instruction.content ? (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {instruction.content}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">
                      {instruction.emptyMessage}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Host CTA */}
        <Card className="mt-6 bg-teal-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Have questions about your move-in?
              </p>
              <a href={`mailto:${host.email}`}>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  Contact {hostName}
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

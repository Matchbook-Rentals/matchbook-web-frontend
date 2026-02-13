import { Button } from "@/components/ui/button";
import PropertyDetailsSection from "./property-details-section";
import MapPlaceholder from "./map-placeholder";
import { TablessPaymentsTable } from "./tabless-payments-table";
import RenterNavbar from "@/components/renter-navbar";
import prisma from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

function formatAddress(listing: any): string {
  const parts = [
    listing.streetAddress1,
    listing.city,
    listing.state,
    listing.postalCode
  ].filter(Boolean);
  return parts.join(', ');
}

export default async function StaticDemoPage() {
  // Get current user for navbar
  const { userId } = auth();
  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      email: true,
    }
  }) : null;

  // Fetch a random booking from the user's bookings
  let booking = null;
  if (userId) {
    const bookingCount = await prisma.booking.count({
      where: { userId: userId }
    });

    if (bookingCount > 0) {
      const randomOffset = Math.floor(Math.random() * bookingCount);
      booking = await prisma.booking.findFirst({
        where: { userId: userId },
        skip: randomOffset,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              streetAddress1: true,
              city: true,
              state: true,
              postalCode: true,
              imageSrc: true,
              latitude: true,
              longitude: true,
              listingImages: {
                take: 1,
                select: { url: true }
              }
            }
          },
          match: {
            select: {
              id: true,
              leaseDocumentId: true
            }
          },
          trip: {
            select: {
              numAdults: true,
              numChildren: true,
              numPets: true
            }
          }
        }
      });
    }
  }

  // Fallback: Fetch a random approved listing if no booking found
  let listing = null;
  if (!booking) {
    const listingCount = await prisma.listing.count({
      where: {
        approvalStatus: 'approved',
        markedActiveByUser: true,
      }
    });

    if (listingCount > 0) {
      const randomOffset = Math.floor(Math.random() * listingCount);
      listing = await prisma.listing.findFirst({
        where: {
          approvalStatus: 'approved',
          markedActiveByUser: true,
        },
        skip: randomOffset,
        select: {
          id: true,
          title: true,
          streetAddress1: true,
          city: true,
          state: true,
          postalCode: true,
          imageSrc: true,
          latitude: true,
          longitude: true,
          listingImages: {
            take: 1,
            select: { url: true }
          }
        }
      });
    }
  }

  // Prepare property data from booking (or fallback to listing/mock data)
  const propertyData = booking ? {
    title: booking.listing.title || "Beautiful Rental Home",
    imageSrc: booking.listing.listingImages?.[0]?.url || booking.listing.imageSrc || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    address: formatAddress(booking.listing),
    startDate: booking.startDate,
    endDate: booking.endDate,
    numAdults: booking.trip?.numAdults || 2,
    numChildren: booking.trip?.numChildren || 0,
    numPets: booking.trip?.numPets || 0,
    bookingId: booking.id,
    matchId: booking.matchId,
    leaseDocumentId: booking.match?.leaseDocumentId,
    listingId: booking.listing.id,
  } : listing ? {
    title: listing.title || "Beautiful Rental Home",
    imageSrc: listing.listingImages?.[0]?.url || listing.imageSrc || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    address: formatAddress(listing),
    startDate: new Date("2025-06-12"),
    endDate: new Date("2025-09-12"),
    numAdults: 2,
    numChildren: 1,
    numPets: 1,
    listingId: listing.id,
  } : {
    title: "Luxury Home with Golden Gate Bridge View",
    imageSrc: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    address: "3024 N 1400 E North Ogden, UT 84414",
    startDate: new Date("2025-06-12"),
    endDate: new Date("2025-09-12"),
    numAdults: 2,
    numChildren: 1,
    numPets: 1,
  };

  const mapCoordinates = booking ? {
    latitude: booking.listing.latitude,
    longitude: booking.listing.longitude
  } : listing ? {
    latitude: listing.latitude,
    longitude: listing.longitude
  } : {
    latitude: 41.3057,
    longitude: -111.9538
  };

  // Fake payments data
  const samplePaymentsData = {
    upcoming: [
      {
        amount: "2,350.30",
        type: "Monthly Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "03/15/2025",
        status: "Scheduled",
        paymentId: "demo-1",
      },
      {
        amount: "2,350.30",
        type: "Monthly Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "04/15/2025",
        status: "Scheduled",
        paymentId: "demo-2",
      },
      {
        amount: "2,350.30",
        type: "Monthly Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "05/15/2025",
        status: "Scheduled",
        paymentId: "demo-3",
      },
    ],
    past: [
      {
        amount: "2,350.30",
        type: "Deposit",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "01/15/2025",
        status: "Completed",
        paymentId: "demo-4",
      },
      {
        amount: "2,350.30",
        type: "Monthly Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "02/15/2025",
        status: "Completed",
        paymentId: "demo-5",
      },
    ],
  };

  const samplePaymentMethods = [
    {
      id: "pm_demo_1",
      type: "bank" as const,
      bankName: "Chase",
      lastFour: "4242",
    },
    {
      id: "pm_demo_2",
      type: "card" as const,
      brand: "visa",
      lastFour: "1234",
      expiry: "12/2026",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <RenterNavbar
        userId={userId}
        user={user}
        isSignedIn={!!userId}
      />
      
      <div className="max-w-[1280px] mx-auto">
        {/* Header with Back Button */}
        <div className="px-6 mt-4">
          <Button
            variant="outline"
            className="border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            Back
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Property Details */}
          <PropertyDetailsSection {...propertyData} />

          {/* Right Column - Map */}
          <MapPlaceholder {...mapCoordinates} />
        </div>

        {/* Payments Section */}
        <div className="px-6 py-8">
          <TablessPaymentsTable
            paymentsData={samplePaymentsData}
            hostName="Daniel Resner"
            hostAvatar="/avatar-5.png"
            bookingId="demo-booking-123"
            initialPaymentMethods={samplePaymentMethods}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { Button } from "@/components/ui/button";
import PropertyDetailsSection from "./property-details-section";
import MapPlaceholder from "./map-placeholder";
import PaymentsSection from "./payments-section";
import { RentPaymentsTable } from "@/app/app/rent/bookings/components/rent-payments-table";

export default function DemoPage() {
  // Sample data for the real payments table
  const samplePaymentsData = {
    upcoming: [
      {
        amount: "2,350.30",
        type: "Monthly Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "03/15/2025",
        status: "Scheduled",
        paymentId: "1",
      },
      {
        amount: "2,350.30",
        type: "Monthly Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "04/15/2025",
        status: "Scheduled",
        paymentId: "2",
      },
      {
        amount: "2,350.30",
        type: "Monthly Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "05/15/2025",
        status: "Scheduled",
        paymentId: "3",
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
        paymentId: "4",
      },
      {
        amount: "2,350.30",
        type: "Monthly Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "02/15/2025",
        status: "Completed",
        paymentId: "5",
      },
    ],
  };

  const samplePaymentMethods = [
    {
      id: "pm_1",
      type: "bank" as const,
      bankName: "Chase",
      lastFour: "4242",
    },
    {
      id: "pm_2",
      type: "card" as const,
      brand: "visa",
      lastFour: "1234",
      expiry: "12/2026",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1280px] mx-auto">
        {/* Header with Back Button */}
        <div className="px-6 pt-6">
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
          <PropertyDetailsSection />

          {/* Right Column - Map Placeholder */}
          <MapPlaceholder />
        </div>

        {/* Fake Payments Section */}
        <div className="px-6 py-8">
          <PaymentsSection />
        </div>

        {/* Real Payments Table */}
        <div className="px-6 py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Real Payments Table</h2>
          <RentPaymentsTable
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

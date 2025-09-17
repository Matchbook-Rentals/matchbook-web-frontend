'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BookingManagementTable from './booking-management-table'
import BookingModificationTable from './booking-modification-table'
import PaymentModificationTable from './payment-modification-table'
import { CombinedBookingData, BookingModificationWithDetails, PaymentModificationWithDetails } from './_actions'

interface BookingManagementTabsProps {
  activeTab: string;
  currentPage: number;
  pageSize: number;
  search: string;
  status: string;
  startDate?: string;
  endDate?: string;
  bookings: CombinedBookingData[];
  bookingsCount: number;
  bookingModifications: BookingModificationWithDetails[];
  bookingModificationsCount: number;
  paymentModifications: PaymentModificationWithDetails[];
  paymentModificationsCount: number;
}

export default function BookingManagementTabs({
  activeTab,
  currentPage,
  pageSize,
  search,
  status,
  startDate,
  endDate,
  bookings,
  bookingsCount,
  bookingModifications,
  bookingModificationsCount,
  paymentModifications,
  paymentModificationsCount
}: BookingManagementTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    params.delete('page'); // Reset to first page when switching tabs
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="bookings" className="relative">
          Bookings
          <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
            {bookingsCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="booking-modifications" className="relative">
          Booking Changes
          <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
            {bookingModificationsCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="payment-modifications" className="relative">
          Payment Changes
          <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
            {paymentModificationsCount}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bookings" className="mt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">All Bookings</h3>
            <p className="text-sm text-muted-foreground">
              View and manage all bookings. You can cancel, modify, or revert bookings back to matches.
            </p>
          </div>
          <BookingManagementTable
            bookings={bookings}
            totalCount={bookingsCount}
            currentPage={currentPage}
            pageSize={pageSize}
            search={search}
            status={status}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </TabsContent>

      <TabsContent value="booking-modifications" className="mt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Booking Modifications</h3>
            <p className="text-sm text-muted-foreground">
              View and manage booking date change requests between hosts and guests.
            </p>
          </div>
          <BookingModificationTable
            modifications={bookingModifications}
            totalCount={bookingModificationsCount}
            currentPage={currentPage}
            pageSize={pageSize}
            search={search}
            status={status}
          />
        </div>
      </TabsContent>

      <TabsContent value="payment-modifications" className="mt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Payment Modifications</h3>
            <p className="text-sm text-muted-foreground">
              View and manage payment amount and due date change requests.
            </p>
          </div>
          <PaymentModificationTable
            modifications={paymentModifications}
            totalCount={paymentModificationsCount}
            currentPage={currentPage}
            pageSize={pageSize}
            search={search}
            status={status}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
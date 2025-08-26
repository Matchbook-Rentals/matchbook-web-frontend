import { getAllBookings, CombinedBookingData } from './_actions'
import BookingManagementTable from './booking-management-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PAGE_SIZE = 20;

interface BookingManagementPageProps {
  searchParams?: {
    page?: string;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default async function BookingManagementPage({ searchParams }: BookingManagementPageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const search = searchParams?.search || '';
  const status = searchParams?.status || 'all';
  const startDate = searchParams?.startDate;
  const endDate = searchParams?.endDate;

  const { bookings, totalCount } = await getAllBookings({ 
    page: currentPage, 
    pageSize: PAGE_SIZE,
    search,
    status,
    startDate,
    endDate
  });

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Booking Management ({totalCount})</CardTitle>
          <p className="text-muted-foreground">
            Manage all bookings across the platform. You can cancel, modify, or revert bookings back to matches.
          </p>
        </CardHeader>
        <CardContent>
          <BookingManagementTable
            bookings={bookings}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            search={search}
            status={status}
            startDate={startDate}
            endDate={endDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
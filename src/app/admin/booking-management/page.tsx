import { getAllBookings, CombinedBookingData } from './_actions'
import BookingManagementTable from './booking-management-table'

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
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Booking Management ({totalCount})</h1>
        <p className="text-muted-foreground mt-2">
          Manage all bookings across the platform. Click &quot;View Booking&quot; to see detailed information, payment schedules, and modification history.
        </p>
      </div>

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
    </div>
  );
}
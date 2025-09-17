import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import BookingModificationsView from '@/components/BookingModificationsView'
import { getBookingWithModifications } from '@/app/actions/bookings'

interface PageProps {
  params: {
    bookingId: string
  }
}

export default async function RenterBookingChangesPage({ params }: PageProps) {
  const { userId } = auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const { bookingId } = params

  try {
    const result = await getBookingWithModifications(bookingId)
    
    if (!result.success || !result.booking) {
      return (
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/app/rent/bookings">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bookings
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-600">Booking not found</p>
          </div>
        </div>
      )
    }

    const booking = result.booking
    const bookingTitle = booking.listing?.title || 'Booking'

    // Verify user has permission to view this booking (is the renter)
    if (booking.userId !== userId) {
      redirect('/app/rent/bookings')
    }

    return (
      <div className="">
        {/* Header with back navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/app/rent/bookings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
        </div>

        {/* Modifications view */}
        <BookingModificationsView 
          bookingId={bookingId}
          bookingTitle={bookingTitle}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading booking changes:', error)
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/app/rent/bookings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load booking changes</p>
        </div>
      </div>
    )
  }
}

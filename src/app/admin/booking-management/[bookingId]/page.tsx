import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  XCircle, 
  RotateCcw,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getBookingDetails } from '../_actions'
import BookingActions from './booking-actions'

interface BookingDetailsPageProps {
  params: {
    bookingId: string;
  };
}

function getStatusBadgeColor(status: string) {
  switch (status.toLowerCase()) {
    case 'reserved':
      return 'bg-blue-100 text-blue-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const booking = await getBookingDetails(params.bookingId);

  if (!booking) {
    notFound();
  }

  const totalGuests = (booking.trip?.numAdults || 0) + (booking.trip?.numChildren || 0);
  const paidRentPayments = booking.rentPayments?.filter(payment => payment.isPaid) || [];
  const unpaidRentPayments = booking.rentPayments?.filter(payment => !payment.isPaid) || [];
  const totalPaidAmount = paidRentPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalUnpaidAmount = unpaidRentPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Check if this is a pending booking
  const isPendingBooking = 'type' in booking && booking.type === 'pending_signature';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/booking-management">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isPendingBooking ? 'Pending Booking Details' : 'Booking Details'}
            </h1>
            <p className="text-muted-foreground">ID: {booking.id}</p>
            {isPendingBooking && (
              <p className="text-sm text-orange-600 font-medium">
                Awaiting landlord signature to complete booking
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadgeColor(booking.status)}>
            {booking.status === 'awaiting_signature' ? 'Awaiting Signature' : booking.status}
          </Badge>
          <BookingActions bookingId={booking.id} currentStatus={booking.status} isPending={isPendingBooking} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-medium">
                    {booking.user.firstName} {booking.user.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p>{booking.user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Guests</label>
                  <p>{totalGuests} guest{totalGuests !== 1 ? 's' : ''}</p>
                  {booking.trip && (
                    <p className="text-sm text-muted-foreground">
                      {booking.trip.numAdults} adults
                      {booking.trip.numChildren > 0 && `, ${booking.trip.numChildren} children`}
                      {booking.trip.numPets > 0 && `, ${booking.trip.numPets} pets`}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Listing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {booking.listing.imageSrc && (
                  <img 
                    src={booking.listing.imageSrc} 
                    alt={booking.listing.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <Link 
                    href={`/admin/listing-management/${booking.listing.id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {booking.listing.title}
                  </Link>
                  <p className="text-muted-foreground">
                    {booking.listing.streetAddress1}, {booking.listing.city}, {booking.listing.state} {booking.listing.postalCode}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Host</label>
                <p className="text-lg font-medium">
                  {booking.listing.user.firstName} {booking.listing.user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{booking.listing.user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Booking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Booking Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Check-in Date</label>
                  <p className="text-lg font-medium">{formatDate(booking.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Check-out Date</label>
                  <p className="text-lg font-medium">{formatDate(booking.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Booking Created</label>
                  <p>{formatDate(booking.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p>{formatDate(booking.updatedAt)}</p>
                </div>
                {booking.moveInCompletedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Move-in Completed</label>
                    <p>{formatDate(booking.moveInCompletedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Monthly Rent</label>
                  <p className="text-2xl font-bold">${booking.monthlyRent?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Paid</label>
                  <p className="text-2xl font-bold text-green-600">${totalPaidAmount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Outstanding</label>
                  <p className="text-2xl font-bold text-orange-600">${totalUnpaidAmount.toLocaleString()}</p>
                </div>
              </div>

              {booking.rentPayments && booking.rentPayments.length > 0 && (
                <div>
                  <Separator className="my-4" />
                  <h4 className="font-medium mb-3">Rent Payment Schedule</h4>
                  <div className="space-y-2">
                    {booking.rentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">${payment.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Due: {formatDate(payment.dueDate)}</p>
                        </div>
                        <Badge variant={payment.isPaid ? "default" : "outline"}>
                          {payment.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature Status (for pending bookings only) */}
          {isPendingBooking && 'boldSignLease' in booking && booking.boldSignLease && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Signature Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tenant Signature</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.boldSignLease.tenantSigned ? "default" : "outline"}>
                        {booking.boldSignLease.tenantSigned ? "Signed" : "Pending"}
                      </Badge>
                      {booking.boldSignLease.tenantSigned && booking.match.tenantSignedAt && (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(booking.match.tenantSignedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Landlord Signature</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.boldSignLease.landlordSigned ? "default" : "outline"}>
                        {booking.boldSignLease.landlordSigned ? "Signed" : "Pending"}
                      </Badge>
                      {booking.boldSignLease.landlordSigned && booking.match.landlordSignedAt && (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(booking.match.landlordSignedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-700">
                    <strong>Next Step:</strong> Waiting for landlord to sign the lease agreement. 
                    Once signed, this will automatically become a confirmed booking.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isPendingBooking && (
                <Button asChild className="w-full">
                  <Link href={`/admin/booking-management/${booking.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Booking
                  </Link>
                </Button>
              )}
              
              {booking.status !== 'cancelled' && (
                <>
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                    <XCircle className="w-4 h-4 mr-2" />
                    {isPendingBooking ? 'Cancel Match' : 'Cancel Booking'}
                  </Button>
                  
                  {!isPendingBooking && (
                    <Button variant="outline" className="w-full text-orange-600 hover:text-orange-700">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Revert to Match
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Match Information */}
          {booking.match && (
            <Card>
              <CardHeader>
                <CardTitle>Related Match</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Match ID</label>
                  <p className="font-mono text-sm">{booking.match.id}</p>
                </div>
                
                {booking.match.paymentStatus && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                    <Badge variant="outline">{booking.match.paymentStatus}</Badge>
                  </div>
                )}

                {booking.match.paymentAuthorizedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Authorized</label>
                    <p className="text-sm">{formatDate(booking.match.paymentAuthorizedAt)}</p>
                  </div>
                )}

                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/admin/match-management/${booking.match.id}`}>
                    View Match Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Trip Information */}
          {booking.trip && (
            <Card>
              <CardHeader>
                <CardTitle>Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Trip ID</label>
                  <p className="font-mono text-sm">{booking.trip.id}</p>
                </div>
                
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/admin/trip-management/${booking.trip.id}`}>
                    View Trip Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
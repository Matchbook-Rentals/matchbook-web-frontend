import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { getBookingDetails, getBookingModificationsForBooking } from '../_actions'
import BookingActions from './booking-actions'
import { calculateRent } from '@/lib/calculate-rent'

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
  const [booking, modifications] = await Promise.all([
    getBookingDetails(params.bookingId),
    getBookingModificationsForBooking(params.bookingId)
  ]);

  if (!booking) {
    notFound();
  }

  const totalGuests = (booking.trip?.numAdults || 0) + (booking.trip?.numChildren || 0);
  const paidRentPayments = booking.rentPayments?.filter(payment => payment.isPaid) || [];
  const unpaidRentPayments = booking.rentPayments?.filter(payment => !payment.isPaid) || [];
  const totalPaidAmount = paidRentPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalUnpaidAmount = unpaidRentPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Get effective monthly rent - use proper calculation logic
  const getEffectiveMonthlyRent = () => {
    // First try stored monthlyRent if valid
    if (booking.monthlyRent && booking.monthlyRent !== 77777) {
      return booking.monthlyRent;
    }

    // Calculate using the proper function
    if (booking.trip && booking.listing) {
      const calculated = calculateRent({
        listing: booking.listing as any, // Will have monthlyPricing
        trip: booking.trip
      });
      if (calculated !== 77777) {
        return calculated;
      }
    }

    // Last fallback: use largest rent payment
    const allPayments = booking.rentPayments || [];
    if (allPayments.length > 0) {
      return Math.max(...allPayments.map(payment => payment.amount));
    }

    return null;
  };

  const effectiveMonthlyRent = getEffectiveMonthlyRent();
  
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payment Schedule</TabsTrigger>
              <TabsTrigger value="modifications">Modifications</TabsTrigger>
              <TabsTrigger value="users">Users & Listing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Guest</label>
                      <p className="text-lg font-medium">
                        {booking.user.firstName} {booking.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{booking.user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Host</label>
                      <p className="text-lg font-medium">
                        {booking.listing.user.firstName} {booking.listing.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{booking.listing.user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Listing</label>
                      <p className="text-lg font-medium">{booking.listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.listing.city}, {booking.listing.state}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Monthly Rent</label>
                      <p className="text-2xl font-bold">${effectiveMonthlyRent ? (effectiveMonthlyRent / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Not Set'}</p>
                    </div>
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

              {/* Guest Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Guest Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Guests</label>
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
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
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
                      <p className="text-2xl font-bold">${effectiveMonthlyRent ? (effectiveMonthlyRent / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Not Set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Paid</label>
                      <p className="text-2xl font-bold text-green-600">${(totalPaidAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Outstanding</label>
                      <p className="text-2xl font-bold text-orange-600">${(totalUnpaidAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                              <p className="font-medium">${(payment.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
            </TabsContent>

            <TabsContent value="modifications" className="mt-6">
              {/* Modifications History */}
              {(modifications.bookingModifications.length > 0 || modifications.paymentModifications.length > 0) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      Modification History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Booking Date Modifications */}
                    {modifications.bookingModifications.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                          Booking Date Changes
                        </h4>
                        <div className="space-y-3">
                          {modifications.bookingModifications.map((mod) => (
                            <div key={mod.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusBadgeColor(mod.status)}>
                                    {mod.status}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Requested by {mod.requestor.firstName} {mod.requestor.lastName}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(mod.requestedAt)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <label className="font-medium text-muted-foreground">Original Dates</label>
                                  <p>{formatDate(mod.originalStartDate)} to {formatDate(mod.originalEndDate)}</p>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground">Requested Dates</label>
                                  <p className="text-blue-600 font-medium">
                                    {formatDate(mod.newStartDate)} to {formatDate(mod.newEndDate)}
                                  </p>
                                </div>
                              </div>

                              {mod.reason && (
                                <div className="mt-3">
                                  <label className="font-medium text-muted-foreground text-sm">Reason</label>
                                  <p className="text-sm mt-1">{mod.reason}</p>
                                </div>
                              )}

                              {mod.status === 'approved' && mod.approvedAt && (
                                <div className="mt-3 text-sm text-green-600">
                                  ✓ Approved on {formatDate(mod.approvedAt)}
                                </div>
                              )}

                              {mod.status === 'rejected' && mod.rejectedAt && (
                                <div className="mt-3 text-sm text-red-600">
                                  ✗ Rejected on {formatDate(mod.rejectedAt)}
                                  {mod.rejectionReason && (
                                    <p className="mt-1">Reason: {mod.rejectionReason}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment Modifications */}
                    {modifications.paymentModifications.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                          Payment Changes
                        </h4>
                        <div className="space-y-3">
                          {modifications.paymentModifications.map((mod) => (
                            <div key={mod.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusBadgeColor(mod.status)}>
                                    {mod.status}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Requested by {mod.requestor.firstName} {mod.requestor.lastName}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(mod.requestedAt)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <label className="font-medium text-muted-foreground">Original Payment</label>
                                  <p>${(mod.originalAmount / 100).toLocaleString()} due {formatDate(mod.originalDueDate)}</p>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground">Requested Payment</label>
                                  <p className="text-blue-600 font-medium">
                                    ${(mod.newAmount / 100).toLocaleString()} due {formatDate(mod.newDueDate)}
                                  </p>
                                </div>
                              </div>

                              {mod.reason && (
                                <div className="mt-3">
                                  <label className="font-medium text-muted-foreground text-sm">Reason</label>
                                  <p className="text-sm mt-1">{mod.reason}</p>
                                </div>
                              )}

                              {mod.status === 'approved' && mod.approvedAt && (
                                <div className="mt-3 text-sm text-green-600">
                                  ✓ Approved on {formatDate(mod.approvedAt)}
                                </div>
                              )}

                              {mod.status === 'rejected' && mod.rejectedAt && (
                                <div className="mt-3 text-sm text-red-600">
                                  ✗ Rejected on {formatDate(mod.rejectedAt)}
                                  {mod.rejectionReason && (
                                    <p className="mt-1">Reason: {mod.rejectionReason}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No modification history found for this booking.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="users" className="mt-6 space-y-6">
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
                      <Link
                        href={`/admin/user-manager/${booking.user.id}`}
                        className="text-lg font-medium hover:underline text-blue-600"
                      >
                        {booking.user.firstName} {booking.user.lastName}
                      </Link>
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
                        className="text-lg font-semibold hover:underline text-blue-600"
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
                    <Link
                      href={`/admin/user-manager/${booking.listing.user.id}`}
                      className="text-lg font-medium hover:underline text-blue-600 block"
                    >
                      {booking.listing.user.firstName} {booking.listing.user.lastName}
                    </Link>
                    <p className="text-sm text-muted-foreground">{booking.listing.user.email}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
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
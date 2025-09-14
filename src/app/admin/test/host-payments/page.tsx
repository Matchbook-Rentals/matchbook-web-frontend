'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, CreditCard, Check, X, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RentPayment {
  id: string;
  bookingId: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  stripePaymentMethodId: string | null;
  paymentAuthorizedAt: Date | null;
  paymentCapturedAt: Date | null;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BookingWithPayments {
  id: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number | null;
  listing: {
    title: string;
    streetAddress1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  rentPayments: RentPayment[];
}

export default function HostPaymentsTestPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [bookingId, setBookingId] = useState('')
  const [booking, setBooking] = useState<BookingWithPayments | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (user) {
      const userRole = user.publicMetadata?.role as string
      const hasAdminAccess = userRole?.includes('admin')
      if (!hasAdminAccess) {
        router.push('/unauthorized')
        return
      }
    }
    setIsLoading(false)
  }, [user, router])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const getPaymentStatus = (payment: RentPayment) => {
    if (payment.isPaid && payment.paymentCapturedAt) {
      return {
        label: "Paid",
        variant: "success" as const,
        icon: <Check className="h-4 w-4" />
      };
    }
    
    if (payment.failureReason && payment.retryCount > 0) {
      return {
        label: "Failed",
        variant: "destructive" as const,
        icon: <X className="h-4 w-4" />
      };
    }
    
    if (payment.paymentAuthorizedAt && !payment.isPaid) {
      const dueDate = new Date(payment.dueDate);
      const now = new Date();
      
      if (now > dueDate) {
        return {
          label: "Overdue",
          variant: "warning" as const,
          icon: <AlertCircle className="h-4 w-4" />
        };
      }
      
      return {
        label: "Scheduled",
        variant: "secondary" as const,
        icon: <Clock className="h-4 w-4" />
      };
    }
    
    return {
      label: "Not Authorized",
      variant: "outline" as const,
      icon: <AlertCircle className="h-4 w-4" />
    };
  };

  // Mock booking data for testing
  const mockBookings: { [key: string]: BookingWithPayments } = {
    'booking-123': {
      id: 'booking-123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      monthlyRent: 2500,
      listing: {
        title: 'Modern Downtown Apartment',
        streetAddress1: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102'
      },
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com'
      },
      rentPayments: [
        {
          id: 'payment-1',
          bookingId: 'booking-123',
          amount: 2500,
          dueDate: new Date('2024-01-01'),
          isPaid: true,
          stripePaymentMethodId: 'pm_test_123',
          paymentAuthorizedAt: new Date('2023-12-28'),
          paymentCapturedAt: new Date('2024-01-01'),
          stripePaymentIntentId: 'pi_test_123',
          failureReason: null,
          retryCount: 0,
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'payment-2',
          bookingId: 'booking-123',
          amount: 2500,
          dueDate: new Date('2024-02-01'),
          isPaid: true,
          stripePaymentMethodId: 'pm_test_123',
          paymentAuthorizedAt: new Date('2024-01-28'),
          paymentCapturedAt: new Date('2024-02-01'),
          stripePaymentIntentId: 'pi_test_124',
          failureReason: null,
          retryCount: 0,
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2024-02-01')
        },
        {
          id: 'payment-3',
          bookingId: 'booking-123',
          amount: 2500,
          dueDate: new Date('2024-03-01'),
          isPaid: false,
          stripePaymentMethodId: 'pm_test_123',
          paymentAuthorizedAt: new Date('2024-02-26'),
          paymentCapturedAt: null,
          stripePaymentIntentId: 'pi_test_125',
          failureReason: 'Insufficient funds',
          retryCount: 2,
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2024-03-01')
        },
        {
          id: 'payment-4',
          bookingId: 'booking-123',
          amount: 2500,
          dueDate: new Date('2024-04-01'),
          isPaid: false,
          stripePaymentMethodId: 'pm_test_123',
          paymentAuthorizedAt: new Date('2024-03-28'),
          paymentCapturedAt: null,
          stripePaymentIntentId: null,
          failureReason: null,
          retryCount: 0,
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2023-12-15')
        }
      ]
    },
    'booking-456': {
      id: 'booking-456',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-11-30'),
      monthlyRent: 3200,
      listing: {
        title: 'Luxury Penthouse with City Views',
        streetAddress1: '456 High Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001'
      },
      user: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@email.com'
      },
      rentPayments: [
        {
          id: 'payment-5',
          bookingId: 'booking-456',
          amount: 3200,
          dueDate: new Date('2024-06-01'),
          isPaid: true,
          stripePaymentMethodId: 'pm_test_456',
          paymentAuthorizedAt: new Date('2024-05-28'),
          paymentCapturedAt: new Date('2024-06-01'),
          stripePaymentIntentId: 'pi_test_456',
          failureReason: null,
          retryCount: 0,
          createdAt: new Date('2024-05-15'),
          updatedAt: new Date('2024-06-01')
        },
        {
          id: 'payment-6',
          bookingId: 'booking-456',
          amount: 3200,
          dueDate: new Date('2024-07-01'),
          isPaid: true,
          stripePaymentMethodId: 'pm_test_456',
          paymentAuthorizedAt: new Date('2024-06-28'),
          paymentCapturedAt: new Date('2024-07-01'),
          stripePaymentIntentId: 'pi_test_457',
          failureReason: null,
          retryCount: 0,
          createdAt: new Date('2024-05-15'),
          updatedAt: new Date('2024-07-01')
        },
        {
          id: 'payment-7',
          bookingId: 'booking-456',
          amount: 3200,
          dueDate: new Date('2024-08-01'),
          isPaid: false,
          stripePaymentMethodId: 'pm_test_456',
          paymentAuthorizedAt: new Date('2024-07-28'),
          paymentCapturedAt: null,
          stripePaymentIntentId: null,
          failureReason: null,
          retryCount: 0,
          createdAt: new Date('2024-05-15'),
          updatedAt: new Date('2024-05-15')
        }
      ]
    },
    'booking-789': {
      id: 'booking-789',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-31'),
      monthlyRent: 1800,
      listing: {
        title: 'Cozy Studio Near Campus',
        streetAddress1: '789 College Ave',
        city: 'Berkeley',
        state: 'CA',
        postalCode: '94720'
      },
      user: {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@email.com'
      },
      rentPayments: []
    }
  }

  const handleSearch = async () => {
    if (!bookingId.trim()) {
      toast.error('Please enter a booking ID')
      return
    }

    setIsSearching(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const foundBooking = mockBookings[bookingId]
    
    if (foundBooking) {
      setBooking(foundBooking)
      toast.success('Booking data loaded successfully')
    } else {
      toast.error('Booking not found. Try: booking-123, booking-456, or booking-789')
      setBooking(null)
    }
    
    setIsSearching(false)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/test')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Test Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Host Payment Display Test</h1>
        <p className="text-muted-foreground">
          Enter a booking ID to display the host payment schedule and details
        </p>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Test Booking IDs:</strong> booking-123, booking-456, booking-789
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="booking-id">Booking ID</Label>
              <Input
                id="booking-id"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Enter booking ID..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {booking && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-lg">{booking.listing.title}</p>
                  <p className="text-gray-600">
                    {booking.listing.streetAddress1}, {booking.listing.city}, {booking.listing.state} {booking.listing.postalCode}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Guest:</span> {booking.user.firstName} {booking.user.lastName} ({booking.user.email})
                  </p>
                </div>
                <div>
                  <p><span className="font-medium">Booking ID:</span> {booking.id}</p>
                  <p><span className="font-medium">Lease Period:</span> {formatDateShort(booking.startDate)} - {formatDateShort(booking.endDate)}</p>
                  <p><span className="font-medium">Monthly Rent:</span> ${booking.monthlyRent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pre-authorized</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Failure Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.rentPayments.map((payment) => {
                    const status = getPaymentStatus(payment);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatDateShort(payment.dueDate)}
                        </TableCell>
                        <TableCell>${payment.amount}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paymentAuthorizedAt ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" />
                              {formatDate(payment.paymentAuthorizedAt)}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                              <X className="h-4 w-4" />
                              Not authorized
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{payment.retryCount}</TableCell>
                        <TableCell>
                          {payment.paymentCapturedAt ? formatDate(payment.paymentCapturedAt) : "-"}
                        </TableCell>
                        <TableCell>
                          {payment.failureReason ? (
                            <span className="text-red-600 text-sm">{payment.failureReason}</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {booking.rentPayments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No rent payments scheduled for this booking.
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                    <p className="text-2xl font-bold">${booking.monthlyRent || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Scheduled Payments</p>
                    <p className="text-2xl font-bold">{booking.rentPayments.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold">
                      ${booking.rentPayments.reduce((sum, payment) => sum + payment.amount, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
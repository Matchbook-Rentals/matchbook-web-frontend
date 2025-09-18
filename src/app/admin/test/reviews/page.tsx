'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Star,
  User,
  Home,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  TestTube,
  Calendar,
  MapPin
} from 'lucide-react'
import {
  createTestReviewScenario,
  getTestReviewData,
  cleanupTestReviewData
} from './_actions'

interface TestResult {
  timestamp: Date
  testType: string
  success: boolean
  data?: any
  error?: string
}

export default function ReviewsTestPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testData, setTestData] = useState<any[]>([])
  const [isCreatingTest, setIsCreatingTest] = useState<string | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      const userRole = user.publicMetadata?.role as string
      const isAdmin = userRole?.includes('admin')
      if (!isAdmin) {
        router.push('/unauthorized')
        return
      }
      loadTestData()
    }
    setIsLoading(false)
  }, [user, router])

  const loadTestData = async () => {
    setIsRefreshing(true)
    try {
      const result = await getTestReviewData()
      if (result.success) {
        setTestData(result.data || [])
      } else {
        addTestResult('Load Test Data', false, undefined, result.error)
      }
    } catch (error) {
      addTestResult('Load Test Data', false, undefined, error.message)
    } finally {
      setIsRefreshing(false)
    }
  }

  const addTestResult = (testType: string, success: boolean, data?: any, error?: string) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date(),
      testType,
      success,
      data,
      error
    }])
  }

  const createTestScenario = async (testType: 'HOST_TO_RENTER' | 'RENTER_TO_LISTING') => {
    setIsCreatingTest(testType)
    try {
      const result = await createTestReviewScenario(testType)

      if (result.success && result.data) {
        addTestResult(`Create ${testType} Test`, true, result.data)

        // Navigate to the review page
        router.push(result.data.reviewUrl)
      } else {
        addTestResult(`Create ${testType} Test`, false, undefined, result.error)
      }
    } catch (error) {
      addTestResult(`Create ${testType} Test`, false, undefined, error.message)
    } finally {
      setIsCreatingTest(null)
    }
  }

  const cleanupTestData = async () => {
    setIsCleaningUp(true)
    try {
      const result = await cleanupTestReviewData()

      if (result.success) {
        addTestResult('Cleanup Test Data', true, { message: result.message })
        await loadTestData() // Refresh the test data display
      } else {
        addTestResult('Cleanup Test Data', false, undefined, result.error)
      }
    } catch (error) {
      addTestResult('Cleanup Test Data', false, undefined, error.message)
    } finally {
      setIsCleaningUp(false)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString()
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reviews Testing Suite</h1>
          <p className="text-muted-foreground mt-2">
            Create test scenarios to test the review functionality for both hosts and renters
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <User className="h-4 w-4 mr-1" />
          {user?.firstName} {user?.lastName}
        </Badge>
      </div>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => createTestScenario('RENTER_TO_LISTING')}
              disabled={isCreatingTest === 'RENTER_TO_LISTING'}
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <div className="flex items-center gap-2 text-lg font-medium">
                <Star className="h-5 w-5" />
                Test Review Listing
              </div>
              <p className="text-sm opacity-90 text-left">
                Create a test scenario where you review a listing as a renter
              </p>
              {isCreatingTest === 'RENTER_TO_LISTING' && (
                <div className="text-xs opacity-75">Creating test scenario...</div>
              )}
            </Button>

            <Button
              onClick={() => createTestScenario('HOST_TO_RENTER')}
              disabled={isCreatingTest === 'HOST_TO_RENTER'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <div className="flex items-center gap-2 text-lg font-medium">
                <User className="h-5 w-5" />
                Test Review Renter
              </div>
              <p className="text-sm opacity-90 text-left">
                Create a test scenario where you review a renter as a host
              </p>
              {isCreatingTest === 'HOST_TO_RENTER' && (
                <div className="text-xs opacity-75">Creating test scenario...</div>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              onClick={loadTestData}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>

            <Button
              onClick={cleanupTestData}
              disabled={isCleaningUp}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isCleaningUp ? 'Cleaning...' : 'Cleanup Test Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Test Data */}
      {testData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Existing Test Data ({testData.length} listings)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testData.map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{listing.title}</h4>
                    <p className="text-sm text-muted-foreground">ID: {listing.id}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(listing.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.city}, {listing.state}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">Test Listing</Badge>
                </div>

                {listing.bookings.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Bookings & Reviews:</h5>
                    {listing.bookings.map((booking: any) => (
                      <div key={booking.id} className="bg-muted/50 rounded p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span>Booking ID: {booking.id}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/app/host/${listing.id}/booking/${booking.id}/review`)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Host Review
                          </Button>
                          <Button
                            onClick={() => router.push(`/app/rent/${booking.id}/review`)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Renter Review
                          </Button>
                        </div>

                        {booking.reviews.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-xs font-medium">Existing Reviews:</span>
                            {booking.reviews.map((review: any) => (
                              <div key={review.id} className="text-xs text-muted-foreground">
                                {review.reviewType}: {review.rating}★
                                {review.comment && ` - "${review.comment.substring(0, 50)}..."`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {testResults.slice(-10).reverse().map((result, index) => (
              <Alert key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.testType}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <AlertDescription>
                      {result.success ? (
                        <span className="text-green-700">
                          {result.data?.message || 'Test completed successfully'}
                          {result.data?.reviewUrl && (
                            <span className="ml-2">
                              <ExternalLink className="h-3 w-3 inline ml-1" />
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-red-700">{result.error}</span>
                      )}
                    </AlertDescription>
                    {result.data && result.data.listingId && (
                      <div className="text-xs text-muted-foreground">
                        Listing: {result.data.listingId} | Booking: {result.data.bookingId}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
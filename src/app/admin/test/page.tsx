'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { PlayIcon, FlaskConical, Globe, Component, Server, FileText, Home, AlertTriangle, Bell, Star, Shield, Download, Upload, RotateCcw, Database } from 'lucide-react'
import Link from 'next/link'

export default function TestSuitesPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  const testFunctions = [
    {
      id: 'payment-creation',
      name: 'Payment Creation Tests',
      description: 'Tests for the generateRentPayments function with various lease scenarios',
      icon: <FlaskConical className="h-5 w-5" />,
      path: '/admin/test/test-payment-creation'
    },
    {
      id: 'webhook-tester',
      name: 'Webhook Tester',
      description: 'Test webhook endpoints by sending POST requests with custom payloads',
      icon: <Server className="h-5 w-5" />,
      path: '/admin/test/webhook-tester'
    },
    {
      id: 'file-upload',
      name: 'File Upload Tests',
      description: 'Test file upload functionality including dropzone and button upload methods',
      icon: <FileText className="h-5 w-5" />,
      path: '/admin/test/file-upload'
    },
    {
      id: 'email-invitation',
      name: 'Email Invitation Tests',
      description: 'Test email invitation functionality for trip invitations',
      icon: <Component className="h-5 w-5" />,
      path: '/admin/test/email-invitation'
    },
    {
      id: 'image-upload',
      name: 'Image Upload Tests',
      description: 'Test image upload functionality and FurnishedFinder CSV processing',
      icon: <Globe className="h-5 w-5" />,
      path: '/admin/test/image-upload'
    },
    {
      id: 'search-preference',
      name: 'Search Preference Tests',
      description: 'Test search preference UI components and functionality',
      icon: <PlayIcon className="h-5 w-5" />,
      path: '/admin/test/search-preference'
    },
    {
      id: 'lease-signing',
      name: 'Lease Signing Tests',
      description: 'Test lease signing client component with different states and user types',
      icon: <FileText className="h-5 w-5" />,
      path: '/admin/test/lease-signing'
    },
    {
      id: 'host-payments',
      name: 'Host Payment Display',
      description: 'Display host payments for specific booking IDs to test payment schedules',
      icon: <FlaskConical className="h-5 w-5" />,
      path: '/admin/test/host-payments'
    },
    {
      id: 'add-property-modal',
      name: 'Add Property Modal',
      description: 'Test property creation modal with start options',
      icon: <Home className="h-5 w-5" />,
      path: '/admin/test/add-property-modal'
    },
    {
      id: 'terms-agreement',
      name: 'Terms Agreement Tests',
      description: 'Test terms agreement logic, database updates, API endpoints, and middleware behavior',
      icon: <FileText className="h-5 w-5" />,
      path: '/admin/test/terms-agreement'
    },
    {
      id: 'global-error-boundary',
      name: 'Global Error Boundary',
      description: 'Test the global error boundary by triggering a runtime error',
      icon: <AlertTriangle className="h-5 w-5" />,
      path: '/admin/test/error-boundary'
    },
    {
      id: 'notifications',
      name: 'Notification Testing',
      description: 'Send test notifications to verify email templates and delivery',
      icon: <Bell className="h-5 w-5" />,
      path: '/admin/test/notifications'
    },
    {
      id: 'reviews',
      name: 'Reviews Testing',
      description: 'Create test scenarios to test review functionality for hosts and renters',
      icon: <Star className="h-5 w-5" />,
      path: '/admin/test/reviews'
    },
    {
      id: 'authenticate-integration',
      name: 'Authenticate Integration',
      description: 'Manage Medallion identity verification integration and reset test data',
      icon: <Shield className="h-5 w-5" />,
      path: '/admin/authenticate-integration'
    },
    {
      id: 'payment-methods',
      name: 'Payment Method Debug',
      description: 'Analyze payment method associations and clear stale references blocking deletion',
      icon: <FlaskConical className="h-5 w-5" />,
      path: '/admin/test/payment-methods'
    },
    {
      id: 'restore-listings',
      name: 'Restore Soft-Deleted Listings',
      description: 'View and restore soft-deleted listings for testing purposes',
      icon: <Home className="h-5 w-5" />,
      path: '/admin/test/restore-listings'
    },
    {
      id: 'listing-export',
      name: 'Listing Export',
      description: 'Export all production listings with complete relations for staging migration',
      icon: <Download className="h-5 w-5" />,
      path: '/admin/test/export'
    },
    {
      id: 'listing-import',
      name: 'Listing Import',
      description: 'Import listings from JSON export file and assign to current user',
      icon: <Upload className="h-5 w-5" />,
      path: '/admin/test/import'
    },
    {
      id: 'application-reset',
      name: 'Application Reset',
      description: 'Reset a user\'s application state to make them appear as fresh users',
      icon: <RotateCcw className="h-5 w-5" />,
      path: '/admin/test/app/reset'
    },
    {
      id: 'stripe-webhooks',
      name: 'Stripe Webhooks',
      description: 'Test and debug Stripe webhook handling and events',
      icon: <Server className="h-5 w-5" />,
      path: '/admin/test/webhooks/stripe'
    },
    {
      id: 'payment-migration',
      name: 'Payment Migration',
      description: 'Migrate existing bookings to itemized payment charge system with security deposit records',
      icon: <Database className="h-5 w-5" />,
      path: '/admin/test/payment-migration'
    }
  ]



  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test Dashboard</h1>
        <p className="text-muted-foreground">
          View and manage all custom test functions in the application
        </p>
      </div>

      {/* Custom Test Functions Section */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          {testFunctions.map((testFunc) => (
            <Card key={testFunc.id} className="w-80 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  {testFunc.icon}
                  <CardTitle className="text-lg">{testFunc.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  {testFunc.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={testFunc.path}>
                  <Button className="w-full flex items-center gap-2">
                    <PlayIcon className="h-4 w-4" />
                    Open
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
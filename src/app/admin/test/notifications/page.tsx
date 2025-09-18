'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { Bell, Send, CheckCircle, XCircle, Loader2, Mail, Home, Check, UserPlus, Info, DollarSign, AlertTriangle, FileText, MessageSquare, Calendar, Eye, Code, Maximize2, Star, Users } from 'lucide-react'
import { sendTestNotification } from './_actions'
import { previewNotificationEmail } from './_preview-actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface NotificationTypeConfig {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'message' | 'application' | 'booking' | 'payment' | 'admin'
  sampleData: {
    senderName?: string
    messageContent?: string
    listingTitle?: string
    amount?: string
  }
}

interface TestResult {
  notificationId: string
  success: boolean
  message: string
  timestamp: Date
  tagLink?: {
    text: string
    url: string
  }
}

export default function NotificationTestPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sendingNotificationId, setSendingNotificationId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [previewingNotification, setPreviewingNotification] = useState<NotificationTypeConfig | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [previewSubject, setPreviewSubject] = useState<string>('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<'visual' | 'html'>('visual')

  const notificationTypes: NotificationTypeConfig[] = [
    // Messages & Communication
    {
      id: 'message',
      name: 'New Message',
      description: 'When a user receives a new message',
      icon: <MessageSquare className="h-4 w-4" />,
      category: 'message',
      sampleData: {
        senderName: 'Sarah Johnson',
        messageContent: 'Hi! I\'m interested in your property. Is it still available for next month? I have a few questions about the amenities.',
        listingTitle: 'Cozy 2BR Apartment in Downtown'
      }
    },
    {
      id: 'new_conversation',
      name: 'New Conversation',
      description: 'When a new conversation is started',
      icon: <Mail className="h-4 w-4" />,
      category: 'message',
      sampleData: {
        senderName: 'Mike Chen',
        listingTitle: 'Modern Studio Near University'
      }
    },
    // Applications & Matching
    {
      id: 'view',
      name: 'Application Received',
      description: 'When a host receives a new application',
      icon: <UserPlus className="h-4 w-4" />,
      category: 'application',
      sampleData: {
        listingTitle: 'Spacious 3BR House',
        senderName: 'Emily Rodriguez'
      }
    },
    {
      id: 'application_approved',
      name: 'Application Approved',
      description: 'When an application is approved',
      icon: <Check className="h-4 w-4" />,
      category: 'application',
      sampleData: {
        listingTitle: 'Luxury Loft in Arts District'
      }
    },
    {
      id: 'application_declined',
      name: 'Application Declined',
      description: 'When an application is declined',
      icon: <XCircle className="h-4 w-4" />,
      category: 'application',
      sampleData: {
        listingTitle: 'Garden View Apartment'
      }
    },
    {
      id: 'application_revoked',
      name: 'Approval Withdrawn',
      description: 'When an approval is withdrawn',
      icon: <XCircle className="h-4 w-4" />,
      category: 'application',
      sampleData: {
        listingTitle: 'Downtown Studio'
      }
    },
    {
      id: 'application_updated',
      name: 'Application Updated',
      description: 'When a renter updates their application',
      icon: <FileText className="h-4 w-4" />,
      category: 'application',
      sampleData: {
        listingTitle: 'Beachfront Condo',
        senderName: 'Alex Thompson'
      }
    },
    {
      id: 'application_approved_lease_ready',
      name: 'Lease Ready for Signature',
      description: 'Application approved and lease is ready',
      icon: <FileText className="h-4 w-4" />,
      category: 'application',
      sampleData: {
        listingTitle: 'Downtown Executive Suite'
      }
    },
    // Bookings
    {
      id: 'booking_host',
      name: 'Booking Confirmation (Host)',
      description: 'When a host receives a booking confirmation',
      icon: <Home className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        listingTitle: 'Beachfront Condo',
        senderName: 'David Thompson',
        amount: 'April 1, 2024'  // Using amount for move-in date
      }
    },
    {
      id: 'booking_confirmed',
      name: 'Booking Confirmation (Renter)',
      description: 'When a renter\'s booking is confirmed',
      icon: <CheckCircle className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        listingTitle: 'Ocean View Apartment',
        messageContent: 'Miami Beach',  // Using messageContent for city
        amount: 'Mar 15 - Mar 22'  // Using amount for date range
      }
    },
    {
      id: 'booking_change_request',
      name: 'Booking Change Request',
      description: 'When a booking change is requested',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        listingTitle: 'Downtown Loft'
      }
    },
    {
      id: 'booking_change_declined',
      name: 'Booking Change Declined',
      description: 'When a booking change is declined',
      icon: <XCircle className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        senderName: 'Michael Davis'
      }
    },
    {
      id: 'booking_change_approved',
      name: 'Booking Change Approved',
      description: 'When a booking change is approved',
      icon: <CheckCircle className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        senderName: 'Lisa Anderson'
      }
    },
    {
      id: 'move_in_upcoming',
      name: 'Move-In Reminder',
      description: 'Upcoming move-in reminder',
      icon: <Calendar className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        listingTitle: 'Mountain View Cabin'
      }
    },
    {
      id: 'move_in_upcoming_host',
      name: 'Move-In Reminder (Host)',
      description: 'Host notification for upcoming guest arrival',
      icon: <Calendar className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        listingTitle: 'Mountain View Cabin',
        senderName: 'Emily Johnson'
      }
    },
    {
      id: 'move_out_upcoming',
      name: 'Move-Out Reminder',
      description: 'Upcoming move-out reminder',
      icon: <Calendar className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        listingTitle: 'City Center Flat'
      }
    },
    // Payments
    {
      id: 'payment_success',
      name: 'Payment Success',
      description: 'When a payment is successful',
      icon: <DollarSign className="h-4 w-4" />,
      category: 'payment',
      sampleData: {
        amount: '2,500',
        listingTitle: 'Premium Suite'
      }
    },
    {
      id: 'payment_failed',
      name: 'Payment Failed',
      description: 'When a payment fails',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'payment',
      sampleData: {
        amount: '1,800',
        listingTitle: 'Riverside Apartment'
      }
    },
    {
      id: 'payment_failed_severe',
      name: 'Payment Failed (Second Attempt)',
      description: 'When payment fails after second attempt',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'payment',
      sampleData: {
        amount: '2,200',
        listingTitle: 'Downtown Loft'
      }
    },
    {
      id: 'payment_failed_host',
      name: 'Payment Failed (Host Notification)',
      description: 'Notify host when renter payment fails',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'payment',
      sampleData: {
        amount: '1,950',
        listingTitle: 'Seaside Villa',
        senderName: 'John Smith'  // Using senderName for renterName
      }
    },
    {
      id: 'payment_failed_host_severe',
      name: 'Payment Failed Severe (Host)',
      description: 'Notify host after second payment failure',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'payment',
      sampleData: {
        amount: '2,500',
        listingTitle: 'Mountain Retreat',
        senderName: 'Sarah Johnson'  // Using senderName for renterName
      }
    },
    {
      id: 'payment_authorization_required',
      name: 'Payment Authorization Required',
      description: 'When payment authorization is needed',
      icon: <DollarSign className="h-4 w-4" />,
      category: 'payment',
      sampleData: {
        amount: '3,200',
        listingTitle: 'Penthouse Suite'
      }
    },
    // Reviews
    {
      id: 'review_prompt',
      name: 'Review Prompt (Host)',
      description: 'Prompting host to review after guest checkout',
      icon: <Star className="h-4 w-4" />,
      category: 'review',
      sampleData: {
        renterName: 'John Smith',
        listingTitle: 'Downtown Loft'
      }
    },
    {
      id: 'review_prompt_renter',
      name: 'Review Prompt (Renter)',
      description: 'Prompting renter to review after checkout',
      icon: <Star className="h-4 w-4" />,
      category: 'review',
      sampleData: {
        listingTitle: 'Seaside Cottage'
      }
    },
    // Host
    {
      id: 'listing_approved',
      name: 'Listing Approved',
      description: 'When a host\'s listing is approved',
      icon: <CheckCircle className="h-4 w-4" />,
      category: 'host',
      sampleData: {
        listingTitle: 'Luxury Downtown Condo'
      }
    },
    // Onboarding
    {
      id: 'welcome_renter',
      name: 'Welcome (Renter)',
      description: 'Welcome email for new renters',
      icon: <Users className="h-4 w-4" />,
      category: 'onboarding',
      sampleData: {}
    },
    // Admin
    {
      id: 'ADMIN_INFO',
      name: 'Admin Info',
      description: 'Administrative information notification',
      icon: <Info className="h-4 w-4" />,
      category: 'admin',
      sampleData: {
        messageContent: 'System maintenance scheduled for tonight at 2 AM PST'
      }
    },
    {
      id: 'ADMIN_WARNING',
      name: 'Admin Warning',
      description: 'Administrative warning notification',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'admin',
      sampleData: {
        messageContent: 'Your account requires immediate attention regarding verification'
      }
    },
    {
      id: 'ADMIN_SUCCESS',
      name: 'Admin Success',
      description: 'Administrative success notification',
      icon: <CheckCircle className="h-4 w-4" />,
      category: 'admin',
      sampleData: {
        messageContent: 'Your verification has been successfully completed'
      }
    }
  ]

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

  const handleSendNotification = async (notificationType: NotificationTypeConfig) => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      toast({
        title: "Error",
        description: "No email address found for current user",
        variant: "destructive"
      })
      return
    }

    setSendingNotificationId(notificationType.id)
    
    try {
      const result = await sendTestNotification({
        type: notificationType.id,
        recipientEmail: user.primaryEmailAddress.emailAddress,
        ...notificationType.sampleData
      })

      // Generate tagLink based on notification type
      let tagLink: { text: string, url: string } | undefined
      const testId = Date.now()
      
      switch (notificationType.id) {
        case 'message':
        case 'new_conversation':
          tagLink = {
            text: 'View Conversation',
            url: `/app/messages?convo=test-${testId}`
          }
          break
        case 'view':
        case 'application_approved':
        case 'application_declined':
        case 'application_revoked':
        case 'application_updated':
        case 'application_approved_lease_ready':
          tagLink = {
            text: 'View Listing',
            url: `/searches/test-trip/listing/test-listing-${testId}`
          }
          break
        case 'booking_host':
        case 'booking_confirmed':
        case 'move_in_upcoming':
        case 'move_out_upcoming':
          tagLink = {
            text: 'View Booking',
            url: `/app/host-dashboard?tab=bookings&id=${testId}`
          }
          break
        case 'payment_success':
        case 'payment_failed':
        case 'payment_authorization_required':
          tagLink = {
            text: 'View Payment',
            url: `/app/renter/payments?id=${testId}`
          }
          break
        case 'ADMIN_INFO':
        case 'ADMIN_WARNING':
        case 'ADMIN_SUCCESS':
          tagLink = {
            text: 'Dashboard',
            url: '/app/dashboard'
          }
          break
      }

      const testResult: TestResult = {
        notificationId: notificationType.id,
        success: result.success,
        message: result.success 
          ? `Successfully sent "${notificationType.name}" notification`
          : result.error || 'Failed to send notification',
        timestamp: new Date(),
        tagLink
      }

      setTestResults(prev => [testResult, ...prev].slice(0, 10))

      if (result.success) {
        toast({
          title: "Success",
          description: `Test "${notificationType.name}" notification sent to ${user.primaryEmailAddress.emailAddress}`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send notification",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setSendingNotificationId(null)
    }
  }

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      message: 'bg-blue-100 text-blue-800',
      application: 'bg-green-100 text-green-800',
      booking: 'bg-purple-100 text-purple-800',
      payment: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800',
      host: 'bg-indigo-100 text-indigo-800',
      onboarding: 'bg-teal-100 text-teal-800'
    }
    return categoryColors[category] || 'bg-gray-100 text-gray-800'
  }

  // List of notification types that have email templates configured
  const configuredNotificationTypes = [
    'message',
    'new_conversation',
    'view', // Application received
    'application_approved',
    'application_declined',
    'application_revoked',
    'application_updated',
    'review_prompt',
    'review_prompt_renter',
    'booking_host',
    'booking_confirmed',
    'booking_change_request',
    'booking_change_declined',
    'booking_change_approved',
    'move_in_upcoming',
    'move_in_upcoming_host',
    'payment_failed',
    'payment_failed_severe',
    'payment_failed_host',
    'payment_failed_host_severe',
    'listing_approved',
    'welcome_renter',
    'ADMIN_INFO',
    'ADMIN_WARNING',
    'ADMIN_ERROR',
    'ADMIN_SUCCESS'
  ]

  const isNotificationConfigured = (notificationId: string) => {
    return configuredNotificationTypes.includes(notificationId)
  }

  // Group notifications by category
  const groupedNotifications = notificationTypes.reduce((acc, notification) => {
    if (!acc[notification.category]) {
      acc[notification.category] = []
    }
    acc[notification.category].push(notification)
    return acc
  }, {} as Record<string, typeof notificationTypes>)

  // Category display names
  const categoryDisplayNames: Record<string, string> = {
    message: 'Messages',
    application: 'Applications',
    booking: 'Bookings',
    payment: 'Payments',
    review: 'Reviews',
    host: 'Host',
    onboarding: 'Onboarding',
    admin: 'Admin'
  }

  const handlePreviewNotification = async (notification: NotificationTypeConfig) => {
    setPreviewingNotification(notification)
    setIsLoadingPreview(true)
    
    try {
      const result = await previewNotificationEmail({
        type: notification.id,
        ...notification.sampleData
      })

      if (result.success) {
        setPreviewHtml(result.html || '')
        setPreviewSubject(result.subject || 'Email Preview')
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate preview",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive"
      })
    } finally {
      setIsLoadingPreview(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Testing Suite</h1>
        <p className="text-muted-foreground">
          Click &quot;Send to Admin&quot; to send test notifications to your email address: {user?.primaryEmailAddress?.emailAddress}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Available Notification Types
          </CardTitle>
          <CardDescription>
            All notifications will be sent to your admin email with sample data
          </CardDescription>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-l-red-500 bg-red-50/30"></div>
              <span className="text-muted-foreground">Missing email template (uses default)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200"></div>
              <span className="text-muted-foreground">Custom email template configured</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedNotifications).map(([category, notifications]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-base">
                        {categoryDisplayNames[category] || category}
                      </span>
                      <Badge className={getCategoryBadge(category)} variant="secondary">
                        {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Icon</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => {
                        const isConfigured = isNotificationConfigured(notification.id)
                        return (
                          <TableRow 
                            key={notification.id} 
                            className={!isConfigured ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''}
                          >
                            <TableCell>
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                {notification.icon}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {notification.name}
                              {!isConfigured && (
                                <span className="ml-2 text-xs text-red-600 font-normal">(uses default template)</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {notification.description}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePreviewNotification(notification)}
                                >
                                  <Eye className="mr-2 h-3 w-3" />
                                  Preview
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSendNotification(notification)}
                                  disabled={sendingNotificationId === notification.id}
                                >
                                  {sendingNotificationId === notification.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-3 w-3" />
                                      Send
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Email Preview Section */}
      {previewingNotification && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Preview: {previewingNotification.name}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFullScreenPreview(true)}
              >
                <Maximize2 className="mr-2 h-3 w-3" />
                Fullscreen
              </Button>
            </CardTitle>
            <CardDescription>
              Subject: {previewSubject}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPreview ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visual' | 'html')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visual">Visual Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML Code</TabsTrigger>
                </TabsList>
                <TabsContent value="visual" className="mt-4">
                  <div className="border rounded-lg bg-white overflow-hidden">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[600px]"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="html" className="mt-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute right-2 top-2 z-10"
                      onClick={() => {
                        navigator.clipboard.writeText(previewHtml)
                        toast({
                          title: "Copied",
                          description: "HTML copied to clipboard",
                        })
                      }}
                    >
                      <Code className="mr-2 h-3 w-3" />
                      Copy HTML
                    </Button>
                    <pre className="border rounded-lg p-4 overflow-auto max-h-[600px] bg-gray-50">
                      <code className="text-xs">{previewHtml}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Preview Dialog */}
      <Dialog open={showFullScreenPreview} onOpenChange={setShowFullScreenPreview}>
        <DialogContent className="max-w-4xl w-full h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {previewingNotification?.name} - Email Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full"
              title="Email Preview Fullscreen"
              sandbox="allow-same-origin"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
            <CardDescription>
              Last 10 test notifications sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => {
                const notification = notificationTypes.find(n => n.id === result.notificationId)
                return (
                  <Alert key={index} variant={result.success ? "default" : "destructive"}>
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="font-medium">{notification?.name}:</span> {result.message}
                          </div>
                          {result.tagLink && (
                            <Link 
                              href={result.tagLink.url}
                              target="_blank"
                              className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            >
                              {result.tagLink.text}
                            </Link>
                          )}
                        </AlertDescription>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </Alert>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
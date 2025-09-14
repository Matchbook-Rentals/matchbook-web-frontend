'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { Bell, Send, CheckCircle, XCircle, Loader2, Mail, Home, Check, UserPlus, Info, DollarSign, AlertTriangle, FileText, MessageSquare, Calendar } from 'lucide-react'
import { sendTestNotification } from './_actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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
}

export default function NotificationTestPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sendingNotificationId, setSendingNotificationId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])

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
      id: 'booking',
      name: 'New Booking',
      description: 'When a new booking is created',
      icon: <Home className="h-4 w-4" />,
      category: 'booking',
      sampleData: {
        listingTitle: 'Beachfront Condo',
        senderName: 'David Thompson'
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

      const testResult: TestResult = {
        notificationId: notificationType.id,
        success: result.success,
        message: result.success 
          ? `Successfully sent "${notificationType.name}" notification`
          : result.error || 'Failed to send notification',
        timestamp: new Date()
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
      admin: 'bg-red-100 text-red-800'
    }
    return categoryColors[category] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Testing Suite</h1>
        <p className="text-muted-foreground">
          Click "Send to Admin" to send test notifications to your email address: {user?.primaryEmailAddress?.emailAddress}
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificationTypes.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {notification.icon}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{notification.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {notification.description}
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryBadge(notification.category)} variant="secondary">
                      {notification.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
                          Send to Admin
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                        <AlertDescription>
                          <span className="font-medium">{notification?.name}:</span> {result.message}
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
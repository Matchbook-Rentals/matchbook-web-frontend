'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { PlayIcon, FlaskConical, Globe, Component, Server, FileText } from 'lucide-react'
import Link from 'next/link'

export default function TestSuitesPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const isAdmin = user.publicMetadata?.role === 'admin'
      if (!isAdmin) {
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
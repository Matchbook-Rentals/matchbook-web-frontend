'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, RefreshCw, User, Database, ExternalLink } from 'lucide-react'
import { TermsAgreementForm } from '@/app/terms/terms-agreement-form'
import { agreeToTerms, getAgreedToTerms } from '@/app/actions/user'

export default function TermsAgreementTestPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [termsStatus, setTermsStatus] = useState<Date | null>(null)
  const [testRedirectUrl, setTestRedirectUrl] = useState('/admin/test')
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      const isAdmin = user.publicMetadata?.role === 'admin'
      if (!isAdmin) {
        router.push('/unauthorized')
        return
      }
      checkTermsStatus()
    }
    setIsLoading(false)
  }, [user, router])

  const checkTermsStatus = async () => {
    setCheckingStatus(true)
    try {
      const agreedDate = await getAgreedToTerms()
      setTermsStatus(agreedDate)
      
      // Also check API endpoint
      const response = await fetch(`/api/check-terms?userId=${user?.id}`)
      const apiResult = await response.json()
      
      addTestResult('Terms Status Check', {
        dbResult: agreedDate,
        apiResult: apiResult.hasAgreedToTerms,
        consistent: !!agreedDate === apiResult.hasAgreedToTerms
      })
    } catch (error) {
      console.error('Error checking terms status:', error)
      addTestResult('Terms Status Check', {
        error: error.message,
        success: false
      })
    } finally {
      setCheckingStatus(false)
    }
  }

  const addTestResult = (testName: string, result: any) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date(),
      testName,
      result
    }])
  }

  const simulateTermsAgreement = async () => {
    try {
      const formData = new FormData()
      formData.append('redirect_url', testRedirectUrl)
      
      const result = await agreeToTerms(formData)
      addTestResult('Terms Agreement Simulation', {
        success: result.success,
        redirectUrl: result.redirectUrl,
        timestamp: new Date()
      })
      
      // Refresh status
      setTimeout(() => {
        checkTermsStatus()
      }, 1000)
    } catch (error) {
      addTestResult('Terms Agreement Simulation', {
        error: error.message,
        success: false
      })
    }
  }

  const testMiddlewareRedirect = () => {
    // Open a test URL that should trigger middleware terms checking
    window.open('/app/rent/preferences?test=middleware', '_blank')
    addTestResult('Middleware Redirect Test', {
      action: 'Opened test URL in new tab',
      url: '/app/rent/preferences?test=middleware',
      note: 'Check if middleware redirects to terms page'
    })
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Terms Agreement Test Suite</h1>
        <p className="text-muted-foreground">
          Test and debug the terms agreement logic including database updates, API endpoints, and middleware behavior
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current Terms Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>User ID:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">{user?.id}</code>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Clerk Metadata:</span>
              <Badge variant={user?.publicMetadata?.agreedToTerms ? "default" : "secondary"}>
                {user?.publicMetadata?.agreedToTerms ? 'Agreed' : 'Not Agreed'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Database Status:</span>
              <div className="flex items-center gap-2">
                <Badge variant={termsStatus ? "default" : "secondary"}>
                  {termsStatus ? 'Agreed' : 'Not Agreed'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkTermsStatus}
                  disabled={checkingStatus}
                >
                  <RefreshCw className={`h-4 w-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {termsStatus && (
              <div className="text-sm text-muted-foreground">
                Agreed on: {termsStatus.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="redirect-url">Test Redirect URL</Label>
              <Input
                id="redirect-url"
                value={testRedirectUrl}
                onChange={(e) => setTestRedirectUrl(e.target.value)}
                placeholder="/app/rent/preferences"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={simulateTermsAgreement} className="w-full">
                Simulate Terms Agreement
              </Button>
              
              <Button onClick={testMiddlewareRedirect} variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Middleware Redirect
              </Button>
              
              <Button onClick={checkTermsStatus} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Terms Agreement Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Terms Agreement Form</CardTitle>
            <p className="text-sm text-muted-foreground">
              This is the actual terms agreement form component. Use this to test the real agreement flow.
            </p>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-muted/50">
              <TermsAgreementForm redirectUrl={testRedirectUrl} />
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Test Results</CardTitle>
            <Button onClick={clearTestResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No test results yet. Run some tests above to see results here.
              </p>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.testName}</h4>
                      <span className="text-sm text-muted-foreground">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
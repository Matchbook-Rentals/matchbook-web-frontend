'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { resetTermsAgreement } from './_actions'
import { useToast } from '@/hooks/use-toast'

export function ClerkIntegrationClient() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleResetTerms = async () => {
    setIsLoading(true)
    try {
      const result = await resetTermsAgreement()
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              User Data Management
            </CardTitle>
            <CardDescription>
              Tools for managing user authentication data and metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Troubleshooting Tool</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    This will reset your terms agreement status to null in both the database and Clerk metadata. 
                    Use this to test the terms agreement flow.
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={handleResetTerms}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset My Terms Agreement
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
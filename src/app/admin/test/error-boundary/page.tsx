'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BrandButton } from '@/components/ui/brandButton'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorBoundaryTestPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          Global Error Boundary Preview
        </h1>
        <p className="text-muted-foreground">
          Preview of how the global error boundary looks with brand styling.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="min-h-screen bg-background flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 w-full max-w-md">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold text-foreground">
                Something went wrong!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                An unexpected error has occurred. We apologize for the inconvenience.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 text-center">
              <div className="text-sm text-muted-foreground">
                Auto-refreshing in <span className="font-medium text-foreground">3</span> seconds
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-3 pt-4">
              <BrandButton
                className="w-full"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Try Again
              </BrandButton>
              
              <BrandButton
                variant="outline"
                className="w-full"
              >
                Go to Homepage
              </BrandButton>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
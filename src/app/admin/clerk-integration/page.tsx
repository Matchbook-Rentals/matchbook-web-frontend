import { checkRole } from '@/utils/roles'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClerkIntegrationClient } from './clerk-integration-client'

export default async function ClerkIntegrationPage() {
  const hasAdminRole = await checkRole('admin')
  
  if (!hasAdminRole) {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Clerk Integration</CardTitle>
          <CardDescription>
            Manage Clerk authentication and user metadata for troubleshooting purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClerkIntegrationClient />
        </CardContent>
      </Card>
    </div>
  )
}
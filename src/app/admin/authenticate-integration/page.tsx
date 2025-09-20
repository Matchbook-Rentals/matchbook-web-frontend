import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VerifiedAccountsManager } from './verified-accounts-manager'

export default async function AuthenticateIntegrationPage() {
  if (!checkRole('admin_dev')) {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authenticate Integration Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Manage Medallion identity verification integration and test user verification flows. This section allows you to view verified users, test verification processes, and reset verification data for testing purposes.
          </p>
        </CardContent>
      </Card>

      <VerifiedAccountsManager />
    </div>
  )
}
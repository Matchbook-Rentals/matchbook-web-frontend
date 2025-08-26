import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectedAccountsManager } from './connected-accounts-manager'

export default async function StripeIntegrationPage() {
  if (!checkRole('admin_dev')) {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Manage Stripe Connect accounts and integration settings. This section allows you to view and manage connected accounts for hosts on the platform.
          </p>
        </CardContent>
      </Card>

      <ConnectedAccountsManager />
    </div>
  )
}
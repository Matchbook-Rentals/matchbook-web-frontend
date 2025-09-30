import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SMSAlertsManager } from './sms-alerts-manager'
import { getSubscriptionStatus } from './_actions'

export default async function SMSAlertsPage() {
  if (!checkRole('admin_dev')) {
    redirect('/unauthorized')
  }

  const subscription = await getSubscriptionStatus()

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SMS Alert Management</CardTitle>
          <CardDescription>
            Configure SMS alerts for critical payment events including disputes, refunds, payment failures, and transfer failures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SMSAlertsManager initialSubscription={subscription} />
        </CardContent>
      </Card>
    </div>
  )
}

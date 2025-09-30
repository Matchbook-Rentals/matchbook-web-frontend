import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentIssuesTable } from './payment-issues-table'
import { getDisputes, getRefunds } from './_actions'

export default async function PaymentIssuesPage() {
  if (!checkRole('admin_dev')) {
    redirect('/unauthorized')
  }

  const [disputes, refunds] = await Promise.all([
    getDisputes(),
    getRefunds(),
  ])

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Issues Dashboard</CardTitle>
          <CardDescription>
            Monitor and manage payment disputes and refunds across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentIssuesTable disputes={disputes} refunds={refunds} />
        </CardContent>
      </Card>
    </div>
  )
}

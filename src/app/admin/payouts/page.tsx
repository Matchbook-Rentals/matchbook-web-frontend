import { getPayouts, getPayoutStats, getPayoutQuarters, getCurrentQuarter } from './_actions'
import PayoutsTable from './payouts-table'

interface PageProps {
  searchParams: {
    quarter?: string
    status?: string
  }
}

export default async function PayoutsPage({ searchParams }: PageProps) {
  const currentQuarter = await getCurrentQuarter()
  const quarter = searchParams.quarter || currentQuarter
  const status = searchParams.status || 'all'

  const [payouts, stats, quarters] = await Promise.all([
    getPayouts({ quarter, status }),
    getPayoutStats(quarter),
    getPayoutQuarters(),
  ])

  // Ensure current quarter is in the list
  if (!quarters.includes(currentQuarter)) {
    quarters.unshift(currentQuarter)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payout Manager</h1>
        <p className="text-gray-500 mt-1">
          Manage quarterly referral payouts to hosts
        </p>
      </div>

      <PayoutsTable
        payouts={payouts}
        stats={stats}
        quarters={quarters}
        quarter={quarter}
        status={status}
      />
    </div>
  )
}

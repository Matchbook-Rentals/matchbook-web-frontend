import { getReferrals, getReferralStats, getPayoutQuarters } from './_actions'
import ReferralsTable from './referrals-table'

const PAGE_SIZE = 20

interface ReferralsPageProps {
  searchParams?: {
    page?: string
    status?: string
    quarter?: string
    search?: string
  }
}

export default async function ReferralsPage({ searchParams }: ReferralsPageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10)
  const status = searchParams?.status || 'all'
  const quarter = searchParams?.quarter || 'all'
  const search = searchParams?.search || ''

  const [{ referrals, totalCount }, stats, quarters] = await Promise.all([
    getReferrals({
      page: currentPage,
      pageSize: PAGE_SIZE,
      status,
      quarter,
      search
    }),
    getReferralStats(),
    getPayoutQuarters()
  ])

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Referral Management</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage host referrals. Referrers earn $50 when their referred host gets their first booking.
        </p>
      </div>

      <ReferralsTable
        referrals={referrals}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        stats={stats}
        quarters={quarters}
        status={status}
        quarter={quarter}
        search={search}
      />
    </div>
  )
}

import { getPendingListings } from '../listing-approval-actions'
import ListingApproval from '../listing-approval'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PAGE_SIZE = 10; // Or fetch from config/constants

interface ListingApprovalPageProps {
  searchParams?: {
    page?: string;
  };
}

export default async function ListingApprovalPage({ searchParams }: ListingApprovalPageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const { listings, totalCount } = await getPendingListings({ page: currentPage, pageSize: PAGE_SIZE });

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Listing Approval ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingApproval
            listings={listings}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </div>
  )
}

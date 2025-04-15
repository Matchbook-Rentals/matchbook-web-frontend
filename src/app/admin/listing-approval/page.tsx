import { getPendingListings } from '../listing-approval-actions'
import ListingApproval from '../listing-approval'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ListingApprovalPage() {
  const listings = await getPendingListings()

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Listing Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingApproval listings={listings} />
        </CardContent>
      </Card>
    </div>
  )
}
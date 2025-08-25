import { getListingDetailsForEdit } from '../../../listing-management-actions'
import { notFound } from 'next/navigation'
import ListingEditForm from './listing-edit-form'

export default async function ListingEditPage({
  params
}: {
  params: { listingId: string }
}) {
  const listing = await getListingDetailsForEdit(params.listingId)

  if (!listing) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <ListingEditForm listing={listing} />
    </div>
  )
}
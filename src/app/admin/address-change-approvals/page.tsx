import React from 'react'
import { getLocationChanges } from './_actions'
import { LocationChangesTable } from './location-changes-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PageProps {
  searchParams: {
    page?: string
    sortBy?: 'createdAt' | 'listingId'
    sortOrder?: 'asc' | 'desc'
  }
}

export default async function AddressChangeApprovalsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1', 10)
  const sortBy = searchParams.sortBy || 'createdAt'
  const sortOrder = searchParams.sortOrder || 'desc'

  const { locationChanges, total, totalPages, currentPage } = await getLocationChanges(
    page,
    20,
    sortBy,
    sortOrder
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Address Change Approvals</h1>
        <p className="text-gray-600 mt-2">
          Review and monitor location changes made by hosts to their listings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Location Changes</span>
            <span className="text-sm font-normal text-gray-500">
              {total} total changes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LocationChangesTable
            locationChanges={locationChanges}
            totalPages={totalPages}
            currentPage={currentPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </CardContent>
      </Card>
    </div>
  )
}
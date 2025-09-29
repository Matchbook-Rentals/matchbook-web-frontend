import { getOrphanedListings } from '../orphaned-listings-actions'
import OrphanedListingsTable from './orphaned-listings-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

const PAGE_SIZE = 20;

interface OrphanedListingsPageProps {
  searchParams?: {
    page?: string;
    search?: string;
  };
}

export default async function OrphanedListingsPage({ searchParams }: OrphanedListingsPageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const search = searchParams?.search || '';

  const { listings, totalCount, totalListingsSearched } = await getOrphanedListings({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search
  });

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Orphaned Listings ({totalCount})
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Listings that reference non-existent users in the database
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> These listings have invalid user references and cannot be properly displayed to end users.
              You can view details, mark as inactive, or reject them to clean up the database.
              {totalListingsSearched > totalCount && (
                <span className="block mt-2">
                  Found {totalCount} orphaned listings out of {totalListingsSearched} total listings searched.
                </span>
              )}
            </AlertDescription>
          </Alert>

          <OrphanedListingsTable
            listings={listings}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            search={search}
          />
        </CardContent>
      </Card>
    </div>
  )
}
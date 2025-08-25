import { getAllListings } from '../listing-management-actions'
import ListingManagementTable from './listing-management-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PAGE_SIZE = 20;

interface ListingManagementPageProps {
  searchParams?: {
    page?: string;
    search?: string;
    status?: string;
    active?: string;
  };
}

export default async function ListingManagementPage({ searchParams }: ListingManagementPageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const search = searchParams?.search || '';
  const status = searchParams?.status || 'all';
  const active = searchParams?.active || 'all';

  const { listings, totalCount } = await getAllListings({ 
    page: currentPage, 
    pageSize: PAGE_SIZE,
    search,
    status,
    active
  });

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Listing Management ({totalCount})</CardTitle>
          <p className="text-muted-foreground">
            View and manage all property listings across the platform
          </p>
        </CardHeader>
        <CardContent>
          <ListingManagementTable
            listings={listings}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            search={search}
            status={status}
            active={active}
          />
        </CardContent>
      </Card>
    </div>
  )
}
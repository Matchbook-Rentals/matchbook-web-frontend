import { redirect } from 'next/navigation';
import prisma from '@/lib/prismadb'; // Corrected prisma import path
import { checkRole } from '@/utils/roles'; // Corrected import path
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatDateTime } from '@/lib/utils'; // Import the actual utility
import { ErrorsTable } from './errors-table'; // Import the new client component
import type { Prisma } from '@prisma/client'; // Import Prisma types

const ITEMS_PER_PAGE = 20; // Define how many items per page

interface PageProps {
  searchParams?: {
    page?: string;
    query?: string;
    isAuthError?: string; // 'yes' or 'no'
  };
}


export default async function ApplicationErrorsPage({ searchParams }: PageProps) {
  // 1. Authorization Check
  const isAdmin = await checkRole('admin'); 
  if (!isAdmin) {
    redirect('/unauthorized'); // Or your preferred unauthorized page
  }

  // 2. Parse Search Parameters
  const currentPage = Number(searchParams?.page) || 1;
  const query = searchParams?.query || '';
  const authFilterParam = searchParams?.isAuthError; // 'yes', 'no', or undefined

  // 3. Build Prisma Query Conditions
  const where: Prisma.ApplicationErrorWhereInput = {};

  if (query) {
    where.OR = [
      { errorMessage: { contains: query } },
      { pathname: { contains: query } },
      { userId: { contains: query } },
      { errorDigest: { contains: query } },
      { user: { email: { contains: query } } }, // Search user email
    ];
  }

  if (authFilterParam === 'yes') {
    where.isAuthError = true;
  } else if (authFilterParam === 'no') {
    where.isAuthError = false;
  }
  // If authFilterParam is undefined or 'all', no filter is applied

  // 4. Fetch Data (Count and Paginated Results)
  const totalCount = await prisma.applicationError.count({ where });

  const errors = await prisma.applicationError.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: ITEMS_PER_PAGE,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    include: {
      user: { // Include user data if userId is present
        select: {
          email: true, // Assuming 'email' exists on User model
          id: true,
        }
      }
    }
  });

  // 5. Render Page using Client Component
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Application Errors</CardTitle>
          <CardDescription>
            View, search, and filter application errors logged by the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorsTable
            errors={errors}
            totalCount={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            initialQuery={query}
            initialAuthFilter={authFilterParam || 'all'}
          />
        </CardContent>
      </Card>
    </div>
  );
}

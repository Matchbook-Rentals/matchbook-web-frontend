'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatDateTime } from '@/lib/utils';
import { Pagination } from './pagination'; // Import the pagination component
import type { Prisma } from '@prisma/client'; // Import Prisma types

// Define the structure of the error object including the user relation
type ApplicationErrorWithUser = Prisma.ApplicationErrorGetPayload<{
  include: { user: { select: { email: true, id: true } } }
}>;

interface ErrorsTableProps {
  errors: ApplicationErrorWithUser[];
  totalCount: number;
  itemsPerPage: number;
  currentPage: number;
  initialQuery?: string;
  initialAuthFilter?: string; // Use string to represent 'all', 'yes', 'no'
}

export function ErrorsTable({
  errors,
  totalCount,
  itemsPerPage,
  currentPage,
  initialQuery = '',
  initialAuthFilter = 'all',
}: ErrorsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [authFilter, setAuthFilter] = useState(initialAuthFilter);

  // Update URL parameters
  const updateUrlParams = useDebouncedCallback((term: string, filter: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (term) {
      current.set('query', term);
    } else {
      current.delete('query');
    }

    if (filter !== 'all') {
      current.set('isAuthError', filter);
    } else {
      current.delete('isAuthError');
    }

    current.set('page', '1'); // Reset to page 1 on search/filter change

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  }, 300); // Debounce input

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    updateUrlParams(newSearchTerm, authFilter);
  };

  const handleFilterChange = (value: string) => {
    setAuthFilter(value);
    updateUrlParams(searchTerm, value);
  };

  // Effect to sync state with URL on initial load or back/forward navigation
  useEffect(() => {
    setSearchTerm(searchParams.get('query') || '');
    setAuthFilter(searchParams.get('isAuthError') || 'all');
  }, [searchParams]);

  return (
    <div>
      <div className="flex items-center justify-between py-4 gap-2">
        <Input
          placeholder="Search errors (message, path, user...)"
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Select value={authFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Auth Error" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Errors</SelectItem>
            <SelectItem value="yes">Auth Errors Only</SelectItem>
            <SelectItem value="no">Non-Auth Errors</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Pathname</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Auth Error?</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Digest</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              errors.map((error) => (
                <TableRow key={error.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(error.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{error.pathname || 'N/A'}</TableCell>
                  <TableCell className="whitespace-nowrap">{error.user?.email || error.userId || 'Guest'}</TableCell>
                  <TableCell className="whitespace-nowrap">{error.isAuthError ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <span title={error.errorMessage} className="block max-w-md truncate">
                      {error.errorMessage}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{error.errorDigest || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
      />
    </div>
  );
}

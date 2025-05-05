'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
}

export function Pagination({ totalItems, itemsPerPage, currentPage }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries())); // Create mutable copy
    current.set('page', page.toString());
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or less
  }

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <div className="space-x-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
        >
          <DoubleArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
        >
          <DoubleArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

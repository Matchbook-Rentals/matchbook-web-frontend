'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface MoveInFailure {
  id: string;
  renter: string;
  renterEmail: string;
  listing: string;
  location: string;
  startDate: Date;
  issueReportedAt: Date;
  issueNotes: string;
  failedPaymentsCount: number;
  failedPaymentsTotal: number;
}

interface MoveInFailuresTableProps {
  failures: MoveInFailure[];
}

export function MoveInFailuresTable({ failures }: MoveInFailuresTableProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const toggleNotes = (bookingId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  };

  if (failures.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No move-in failures</p>
        <p className="text-sm">All move-ins have been completed successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Renter</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Move-In Date</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Failed Payments</TableHead>
              <TableHead>Issue Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {failures.map((failure) => {
              const isExpanded = expandedNotes.has(failure.id);
              const truncatedNotes =
                failure.issueNotes.length > 100
                  ? failure.issueNotes.substring(0, 100) + '...'
                  : failure.issueNotes;

              return (
                <TableRow key={failure.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{failure.renter}</div>
                      <div className="text-sm text-muted-foreground">
                        {failure.renterEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{failure.listing}</div>
                      <div className="text-sm text-muted-foreground">
                        {failure.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(failure.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(failure.issueReportedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      {failure.failedPaymentsCount} payment{failure.failedPaymentsCount !== 1 ? 's' : ''}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      ${(failure.failedPaymentsTotal / 100).toFixed(2)} total
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm">
                      {isExpanded ? failure.issueNotes : truncatedNotes}
                      {failure.issueNotes.length > 100 && (
                        <button
                          onClick={() => toggleNotes(failure.id)}
                          className="text-primary hover:underline ml-1"
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/booking-management/${failure.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Booking
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

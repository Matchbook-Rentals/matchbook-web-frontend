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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { UncapturedPayment, capturePayment } from './_actions';
import { formatDistanceToNow } from 'date-fns';

interface UncapturedPaymentsTableProps {
  uncapturedPayments: UncapturedPayment[];
  failedPayments: UncapturedPayment[];
}

export function UncapturedPaymentsTable({
  uncapturedPayments,
  failedPayments,
}: UncapturedPaymentsTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<UncapturedPayment | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState<'uncaptured' | 'failed'>('uncaptured');

  const handleCapture = async () => {
    if (!selectedPayment?.paymentIntentId) return;

    setIsCapturing(true);
    try {
      const result = await capturePayment(
        selectedPayment.verificationId,
        selectedPayment.paymentIntentId
      );

      if (result.success) {
        toast.success('Payment captured successfully');
      } else {
        toast.error(result.error || 'Failed to capture payment');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to capture payment');
    } finally {
      setIsCapturing(false);
      setSelectedPayment(null);
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-';
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch (status) {
      case 'requires_capture':
        return <Badge variant="default" className="bg-yellow-500">Requires Capture</Badge>;
      case 'succeeded':
        return <Badge variant="default" className="bg-green-500">Captured</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'requires_payment_method':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const payments = activeTab === 'uncaptured' ? uncapturedPayments : failedPayments;

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'uncaptured' ? 'default' : 'outline'}
          onClick={() => setActiveTab('uncaptured')}
        >
          Uncaptured ({uncapturedPayments.length})
        </Button>
        <Button
          variant={activeTab === 'failed' ? 'default' : 'outline'}
          onClick={() => setActiveTab('failed')}
        >
          Failed/Expired ({failedPayments.length})
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {activeTab === 'uncaptured'
            ? 'No uncaptured payments found'
            : 'No failed payments found'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Authorized</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.visibleId}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{payment.userName || 'Unknown'}</span>
                    <span className="text-sm text-muted-foreground">
                      {payment.userEmail || payment.userId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{payment.subjectName || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{payment.creditBucket || '-'}</Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {formatAmount(payment.paymentAmount)}
                </TableCell>
                <TableCell>{getStatusBadge(payment.paymentStatus)}</TableCell>
                <TableCell>
                  {payment.paymentAuthorizedAt
                    ? formatDistanceToNow(new Date(payment.paymentAuthorizedAt), {
                        addSuffix: true,
                      })
                    : '-'}
                </TableCell>
                <TableCell>
                  {payment.paymentStatus === 'requires_capture' ? (
                    <Button
                      size="sm"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      Capture
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {payment.paymentStatus === 'canceled' ? 'Cancelled' : 'Not capturable'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!selectedPayment}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Capture Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to capture this payment?
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <strong>User:</strong> {selectedPayment?.userName || selectedPayment?.userEmail}
                </div>
                <div>
                  <strong>Amount:</strong> {formatAmount(selectedPayment?.paymentAmount || null)}
                </div>
                <div>
                  <strong>Payment Intent:</strong>{' '}
                  <code className="text-xs">{selectedPayment?.paymentIntentId}</code>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCapturing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCapture} disabled={isCapturing}>
              {isCapturing ? 'Capturing...' : 'Capture Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

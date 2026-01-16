import { redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UncapturedPaymentsTable } from './uncaptured-payments-table';
import {
  getUncapturedPayments,
  getFailedPayments,
  getPaymentStats,
} from './_actions';

export default async function UncapturedPaymentsPage() {
  if (!checkRole('admin_dev')) {
    redirect('/unauthorized');
  }

  const [uncapturedPayments, failedPayments, stats] = await Promise.all([
    getUncapturedPayments(),
    getFailedPayments(),
    getPaymentStats(),
  ]);

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Uncaptured Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uncapturedCount}</div>
            <p className="text-xs text-muted-foreground">
              Ready to capture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Uncaptured Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalUncapturedAmount / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending capture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed/Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.failedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Cannot be captured
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Uncaptured Verification Payments</CardTitle>
          <CardDescription>
            Payments that were authorized but not captured after successful iSoftPull credit checks.
            These represent completed verifications where we were charged by iSoftPull but did not
            collect payment from the user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UncapturedPaymentsTable
            uncapturedPayments={uncapturedPayments}
            failedPayments={failedPayments}
          />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How This Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Uncaptured Payments:</strong> These are payments where the user&apos;s card was
            pre-authorized (hold placed) and the credit check succeeded (we got charged by iSoftPull),
            but the payment capture failed or was missed. You can manually capture these.
          </p>
          <p>
            <strong>Failed/Expired:</strong> These are payments that can no longer be captured
            because the authorization expired (typically 7 days) or was cancelled. These represent
            lost revenue where we paid iSoftPull but couldn&apos;t collect from the user.
          </p>
          <p>
            <strong>Note:</strong> With the recent fix, payment capture now happens server-side
            immediately after a successful credit check, so new uncaptured payments should be rare.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

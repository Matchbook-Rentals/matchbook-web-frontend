import { redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveInFailuresTable } from './move-in-failures-table';
import { getMoveInFailures } from './_actions';

export default async function MoveInFailuresPage() {
  if (!checkRole('admin_dev')) {
    redirect('/unauthorized');
  }

  const failures = await getMoveInFailures();

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Move-In Failures</CardTitle>
          <CardDescription>
            Monitor and manage bookings where renters reported move-in issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MoveInFailuresTable failures={failures} />
        </CardContent>
      </Card>
    </div>
  );
}

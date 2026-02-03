import { getRenterDashboardData } from '@/app/actions/renter-dashboard';
import RenterDashboardClient from './renter-dashboard-client';

export default async function RenterDashboardPage() {
  const data = await getRenterDashboardData();

  return <RenterDashboardClient data={data} />;
}

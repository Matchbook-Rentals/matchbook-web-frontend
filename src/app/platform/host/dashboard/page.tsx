import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to listings as the default dashboard page
  redirect('/platform/host/dashboard/listings');
}
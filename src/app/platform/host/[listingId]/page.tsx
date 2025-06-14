import { redirect } from 'next/navigation';

interface PropertyDashboardPageProps {
  params: { listingId: string }
}

export default async function PropertyDashboardPage({ params }: PropertyDashboardPageProps) {
  const { listingId } = params;
  
  // Redirect to applications tab by default
  redirect(`/platform/host/${listingId}/applications`);
}
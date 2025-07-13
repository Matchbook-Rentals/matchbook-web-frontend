import { redirect } from 'next/navigation';

export default function HostPage() {
  redirect('/app/host/dashboard/overview');
}

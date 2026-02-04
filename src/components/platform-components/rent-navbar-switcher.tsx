'use client';

import { usePathname } from 'next/navigation';
import RenterNavbar from './renterNavbar';
import DashboardNavbar from './dashboard-navbar';

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface RentNavbarSwitcherProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
}

export default function RentNavbarSwitcher({ userId, user, isSignedIn }: RentNavbarSwitcherProps) {
  const pathname = usePathname();

  const isDashboard = pathname === '/rent/dashboard';

  if (isDashboard) {
    return <DashboardNavbar userId={userId} user={user} isSignedIn={isSignedIn} />;
  }

  return <RenterNavbar userId={userId} user={user} isSignedIn={isSignedIn} />;
}

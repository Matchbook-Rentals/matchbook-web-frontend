'use client';

import { Menu, X } from 'lucide-react';
import UserMenu from '@/components/userMenu';
import { useBookingSidebarStore } from '@/stores/booking-sidebar-store';

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface BookingHeaderProps {
  title: string;
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
}

export function BookingHeader({ title, userId, user, isSignedIn }: BookingHeaderProps) {
  const sidebarVisible = useBookingSidebarStore((s) => s.visible);
  const sidebarOpen = useBookingSidebarStore((s) => s.open);
  const toggleSidebar = useBookingSidebarStore((s) => s.toggle);

  return (
    <header className="booking-review__header">
      <div className="booking-review__header-left">
        {sidebarVisible && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close signing panel' : 'Open signing panel'}
            aria-expanded={sidebarOpen}
            className="md:hidden mr-1 inline-flex items-center justify-center w-8 h-8 rounded-md text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
        <div className="booking-review__logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0e7c6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="booking-review__header-title">{title}</span>
      </div>
      <div className="booking-review__header-right">
        <UserMenu
          color="#333"
          mode="header"
          userId={userId}
          user={user}
          isSignedIn={isSignedIn}
        />
      </div>
    </header>
  );
}

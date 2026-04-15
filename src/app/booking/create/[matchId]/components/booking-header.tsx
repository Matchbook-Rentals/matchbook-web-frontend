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
        {/* Mobile-only sidebar toggle. On step 2 (Sign Lease) it takes the title's
            place on mobile. The title hides on mobile when the sidebar is visible. */}
        {sidebarVisible && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close signing panel' : 'Open signing panel'}
            aria-expanded={sidebarOpen}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {/* Logo circle — desktop only */}
        <div className="booking-review__logo hidden md:flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0e7c6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Title — always on desktop, hidden on mobile when the sidebar toggle takes its place */}
        <span className={`booking-review__header-title ${sidebarVisible ? 'hidden md:inline' : ''}`}>
          {title}
        </span>
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

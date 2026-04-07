'use client';

import UserMenu from '@/components/userMenu';

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
  return (
    <header className="booking-review__header">
      <div className="booking-review__header-left">
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

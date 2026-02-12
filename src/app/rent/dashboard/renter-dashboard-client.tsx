'use client';

import { APP_PAGE_MARGIN } from '@/constants/styles';
import { DashboardHeader } from './components/dashboard-header';
import { RecentSearchesSection } from './components/recent-searches-section';
import { BookingsSection } from './components/bookings-section';
import { MatchesSection } from './components/matches-section';
import { ApplicationsSection } from './components/applications-section';
import { FavoritesSection } from './components/favorites-section';
import type { RenterDashboardData } from '@/app/actions/renter-dashboard';

interface RenterDashboardClientProps {
  data: RenterDashboardData;
  isAdmin: boolean;
  currentMode?: string;
}

export default function RenterDashboardClient({ data, isAdmin, currentMode }: RenterDashboardClientProps) {
  const { recentSearches, bookings, matches, applications, favorites, hasMoreFavorites } = data;

  return (
    <div className={`py-6 ${APP_PAGE_MARGIN} max-w-[1280px] mx-auto overflow-x-hidden`}>
      <DashboardHeader isAdmin={isAdmin} currentMode={currentMode} />
      <RecentSearchesSection searches={recentSearches} />
      <BookingsSection bookings={bookings} />
      <MatchesSection matches={matches} />
      <ApplicationsSection applications={applications} />
      <FavoritesSection favorites={favorites} hasMoreFavorites={hasMoreFavorites} />
    </div>
  );
}

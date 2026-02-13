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

  // Matches needing conversion to bookings means favorites should yield its open slot
  const hasActionableMatches = matches.length > 0;

  return (
    <div className={`py-6 ${APP_PAGE_MARGIN} max-w-[1280px] mx-auto overflow-x-hidden`}>
      <DashboardHeader isAdmin={isAdmin} currentMode={currentMode} />
      <RecentSearchesSection searches={recentSearches} defaultOpen />
      <BookingsSection bookings={bookings} />
      <MatchesSection matches={matches} defaultOpen={hasActionableMatches} />
      <ApplicationsSection applications={applications} />
      <FavoritesSection favorites={favorites} hasMoreFavorites={hasMoreFavorites} defaultOpen={!hasActionableMatches} />
    </div>
  );
}

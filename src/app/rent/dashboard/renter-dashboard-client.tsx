'use client';

import { useState, useCallback } from 'react';
import { APP_PAGE_MARGIN } from '@/constants/styles';
import { DashboardHeader } from './components/dashboard-header';
import { RecentSearchesSection } from './components/recent-searches-section';
import { BookingsSection } from './components/bookings-section';
import { MatchesSection } from './components/matches-section';
import { ApplicationsSection } from './components/applications-section';
import { FavoritesSection } from './components/favorites-section';
import type { RenterDashboardData, DashboardMatch, DashboardFavorite } from '@/app/actions/renter-dashboard';

interface RenterDashboardClientProps {
  data: RenterDashboardData;
  isAdmin: boolean;
  currentMode?: string;
}

export default function RenterDashboardClient({ data, isAdmin, currentMode }: RenterDashboardClientProps) {
  const { recentSearches, bookings, applications } = data;

  const [matches, setMatches] = useState(data.matches);
  const [favorites, setFavorites] = useState(data.favorites);

  // When a match is withdrawn, remove from matches and add back to favorites
  const handleWithdrawMatch = useCallback((withdrawnMatch: DashboardMatch) => {
    setMatches((prev) => prev.filter((m) => m.id !== withdrawnMatch.id));

    const restoredFavorite: DashboardFavorite = {
      id: `restored-${withdrawnMatch.id}`,
      tripId: withdrawnMatch.tripId,
      listingId: withdrawnMatch.listingId,
      listing: withdrawnMatch.listing,
      isApplied: false,
      createdAt: new Date(),
    };

    setFavorites((prev) => [restoredFavorite, ...prev]);
  }, []);

  // Matches needing conversion to bookings means favorites should yield its open slot
  const hasActionableMatches = matches.length > 0;

  return (
    <div className={`py-6 ${APP_PAGE_MARGIN} max-w-[1280px] mx-auto overflow-x-hidden`}>
      <DashboardHeader isAdmin={isAdmin} currentMode={currentMode} />
      <RecentSearchesSection searches={recentSearches} defaultOpen />
      <FavoritesSection favorites={favorites} defaultOpen={!hasActionableMatches} />
      <ApplicationsSection applications={applications} />
      <MatchesSection matches={matches} defaultOpen={hasActionableMatches} onWithdraw={handleWithdrawMatch} />
      <BookingsSection bookings={bookings} />
    </div>
  );
}

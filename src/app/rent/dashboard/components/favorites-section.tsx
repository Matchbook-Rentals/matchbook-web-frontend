'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import HomepageListingCard from '@/components/home-components/homepage-listing-card';
import { SectionEmptyState } from './section-empty-state';
import { SectionHeader } from './section-header';
import { useToast } from '@/components/ui/use-toast';
import { optimisticRemoveFavorite, optimisticFavorite } from '@/app/actions/favorites';
import { Button } from '@/components/ui/button';
import type { DashboardFavorite } from '@/app/actions/renter-dashboard';

interface FavoritesSectionProps {
  favorites: DashboardFavorite[];
}

const FAVORITES_PER_LOAD = 12;

export const FavoritesSection = ({ favorites }: FavoritesSectionProps) => {
  const [displayedCount, setDisplayedCount] = useState(FAVORITES_PER_LOAD);
  const [gridColumns, setGridColumns] = useState(2);
  const gridRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [hiddenFavoriteIds, setHiddenFavoriteIds] = useState<Set<string>>(new Set());

  // Filter out hidden favorites (for optimistic UI after unlike)
  const visibleFavorites = favorites.filter((fav) => !hiddenFavoriteIds.has(fav.id));

  // Transform favorites to listing format for HomepageListingCard
  const favoriteListings = visibleFavorites
    .filter((fav) => fav.listing !== null)
    .map((fav) => ({
      ...fav.listing,
      listingImages: fav.listing?.listingImages?.map((img) => ({
        ...img,
        listingId: fav.listingId,
        category: null,
        rank: 0,
        createdAt: new Date(),
      })) || [],
    }));

  // Reset displayed count when favorites change
  useEffect(() => {
    setDisplayedCount(FAVORITES_PER_LOAD);
  }, [visibleFavorites.length]);

  // Handle unlike with undo toast
  const handleUnlike = useCallback(async (listingId: string) => {
    const favorite = favorites.find((fav) => fav.listingId === listingId);
    if (!favorite) return;

    // Optimistic UI - hide the favorite immediately
    setHiddenFavoriteIds((prev) => new Set(prev).add(favorite.id));

    // Remove from database
    const result = await optimisticRemoveFavorite(favorite.tripId, listingId);

    if (!result.success) {
      // If failed, show error and restore the favorite
      setHiddenFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(favorite.id);
        return next;
      });
      toast({
        title: 'Error',
        description: 'Failed to remove favorite',
        variant: 'destructive',
      });
      return;
    }

    // Show success toast with undo option
    const listingTitle = favorite.listing?.title || 'Listing';
    const { dismiss } = toast({
      title: 'Removed from favorites',
      description: `${listingTitle} has been removed from your favorites`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            // Restore the favorite
            setHiddenFavoriteIds((prev) => {
              const next = new Set(prev);
              next.delete(favorite.id);
              return next;
            });

            // Re-add to database
            const undoResult = await optimisticFavorite(favorite.tripId, listingId);

            if (!undoResult.success) {
              toast({
                title: 'Error',
                description: 'Failed to undo. Please try adding the favorite again.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Restored',
                description: `${listingTitle} has been added back to your favorites`,
              });
            }

            dismiss();
          }}
        >
          Undo
        </Button>
      ),
    });
  }, [favorites, toast]);

  // Track grid columns for trigger calculation
  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) setGridColumns(5);
      else if (width >= 768) setGridColumns(4);
      else if (width >= 640) setGridColumns(3);
      else setGridColumns(2);
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  const loadMore = useCallback(() => {
    setDisplayedCount((prev) => Math.min(prev + FAVORITES_PER_LOAD, visibleFavorites.length));
  }, [visibleFavorites.length]);

  const displayedFavorites = visibleFavorites.slice(0, displayedCount);
  const hasMore = displayedCount < visibleFavorites.length;

  // IntersectionObserver to trigger loading more
  useEffect(() => {
    if (!hasMore) return;

    const triggerIndex = Math.max(0, displayedFavorites.length - gridColumns * 2);
    const triggerElement = gridRef.current?.children[triggerIndex] as HTMLElement | undefined;
    if (!triggerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(triggerElement);
    return () => observer.disconnect();
  }, [displayedFavorites.length, gridColumns, hasMore, loadMore]);

  if (visibleFavorites.length === 0) return (
    <section className="mb-8">
      <SectionHeader title="Favorites" count={visibleFavorites.length} />
      <SectionEmptyState
        imageSrc="/empty-states/no-favorites.png"
        title="No favorites yet"
        subtitle="Save listings you love to find them later"
      />
    </section>
  );

  return (
    <section className="mb-8 overflow-x-hidden">
      <SectionHeader title="Favorites" count={visibleFavorites.length} />
      <div ref={gridRef} className="flex flex-wrap gap-6">
        {displayedFavorites.map((fav, index) => (
          <HomepageListingCard
            key={fav.id}
            listing={favoriteListings[index] as any}
            badge="liked"
            tripId={fav.tripId}
            isApplied={fav.isApplied}
            initialFavorited={true}
            onUnlike={handleUnlike}
            isSignedIn={true}
          />
        ))}
      </div>
    </section>
  );
};

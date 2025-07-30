'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { useTripContext } from '@/contexts/trip-context-provider';

interface SearchUndoButtonProps {
  className?: string;
}

const SearchUndoButton: React.FC<SearchUndoButtonProps> = ({ className = '' }) => {
  const { state, actions } = useTripContext();
  const { viewedListings } = state;
  const { setViewedListings, optimisticRemoveLike, optimisticRemoveDislike } = actions;

  const handleBack = async () => {
    if (viewedListings.length === 0) return;

    try {
      const lastAction = viewedListings[viewedListings.length - 1];

      if (lastAction.action === 'favorite') {
        await optimisticRemoveLike(lastAction.listing.id);
      } else if (lastAction.action === 'dislike') {
        await optimisticRemoveDislike(lastAction.listing.id);
      }

      setViewedListings(prev => prev.slice(0, -1));
    } catch (error) {
      console.error('Error during back operation:', error);
    }
  };

  const isDisabled = viewedListings.length === 0;

  return (
    <Button 
      variant="ghost" 
      className={`h-9 px-3.5 py-2.5 rounded-lg ${className}`}
      onClick={handleBack}
      disabled={isDisabled}
    >
      <span className={`font-semibold text-[clamp(12px,2.5vw,14px)] sm:text-[14px] underline ${isDisabled ? 'text-gray-400' : 'text-[#5d606d]'}`}>
        Undo
      </span>
    </Button>
  );
};

export default SearchUndoButton;

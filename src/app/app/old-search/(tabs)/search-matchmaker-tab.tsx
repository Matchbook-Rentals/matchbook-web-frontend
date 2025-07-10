import React, { useState } from 'react';
import MatchViewTab from './search-match-tab';
import { useTripContext } from '@/contexts/trip-context-provider';
import { FilterOptions, DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';

const MatchmakerTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'swipe'>('swipe');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { state } = useTripContext();

  const [filters, setFilters] = useState<FilterOptions>({
    ...DEFAULT_FILTER_OPTIONS,
    moveInDate: state.trip?.startDate || new Date(),
    moveOutDate: state.trip?.endDate || new Date(),
    flexibleMoveInStart: state.trip?.startDate || new Date(),
    flexibleMoveInEnd: state.trip?.startDate || new Date(),
    flexibleMoveOutStart: state.trip?.endDate || new Date(),
    flexibleMoveOutEnd: state.trip?.endDate || new Date(),
  });

  // Updated handleFilterChange function to handle all filter changes, including arrays
  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | number | boolean | string[] | Date
  ) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  return (
    <MatchViewTab />
  );
};


export default MatchmakerTab;

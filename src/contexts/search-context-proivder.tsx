'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { TripAndMatches } from '@/types';

interface SearchContextType {
  activeSearches: TripAndMatches[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchContextProvider');
  }
  return context;
};

interface SearchContextProviderProps {
  children: ReactNode;
  activeSearches: TripAndMatches[];
}

export const SearchContextProvider: React.FC<SearchContextProviderProps> = ({ children, activeSearches }) => {
  return (
    <SearchContext.Provider value={{ activeSearches }}>
      {children}
    </SearchContext.Provider>
  );
};
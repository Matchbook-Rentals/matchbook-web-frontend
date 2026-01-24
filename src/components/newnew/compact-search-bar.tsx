'use client';

import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface CompactSearchBarProps {
  onOpenDialog: () => void;
}

export default function CompactSearchBar({ onOpenDialog }: CompactSearchBarProps) {
  return (
    <button
      onClick={onOpenDialog}
      className="flex items-center gap-3 px-4 py-2 bg-background rounded-full shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <span className="text-sm font-medium text-gray-700">Anywhere</span>
      <span className="text-gray-300">|</span>
      <span className="text-sm font-medium text-gray-700">Any dates</span>
      <span className="text-gray-300">|</span>
      <span className="text-sm text-gray-400">Add guests</span>
      <div className="w-8 h-8 rounded-full bg-primaryBrand flex items-center justify-center ml-1">
        <FaSearch className="text-white text-xs" />
      </div>
    </button>
  );
}

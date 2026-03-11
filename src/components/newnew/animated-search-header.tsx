'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FaSearch } from 'react-icons/fa';
import UserMenu from '@/components/userMenu';
import SearchDialog from '@/components/home-components/SearchDialog';
import CompactSearchBar from './compact-search-bar';

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface AnimatedSearchHeaderProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  isScrolled: boolean;
}

export default function AnimatedSearchHeader({
  userId,
  user,
  isSignedIn,
  isScrolled,
}: AnimatedSearchHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-background"
        initial={false}
        animate={{
          boxShadow: isScrolled ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between px-6 py-2">
          {/* Logo */}
          <div className="flex items-center h-[72px]">
            <Link href="/">
              <img
                className="w-[200px] hidden md:block"
                alt="MatchBook Logo"
                src="/new-green-logo.png"
              />
              <img
                className="w-[35px] block md:hidden"
                alt="MatchBook Logo"
                src="/logo-small.svg"
              />
            </Link>
          </div>

          {/* Center: Animated search bar area */}
          <div className="flex-1 flex justify-center">
            <AnimatePresence mode="wait">
              {isScrolled ? (
                <motion.div
                  key="compact"
                  layoutId="search-bar-container"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <CompactSearchBar onOpenDialog={handleOpenDialog} />
                </motion.div>
              ) : (
                <motion.div
                  key="hero"
                  layoutId="search-bar-container"
                  className="w-full max-w-2xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <HeroSearchBar onOpenDialog={handleOpenDialog} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right side: User menu */}
          <div className="flex items-center gap-4">
            <UserMenu
              color="white"
              mode="header"
              userId={userId}
              user={user}
              isSignedIn={isSignedIn}
              hasListings={undefined}
            />
          </div>
        </div>
      </motion.header>

      {/* Search Dialog */}
      <SearchDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        isSignedIn={isSignedIn}
      />
    </>
  );
}

// Hero search bar (full-size version)
function HeroSearchBar({ onOpenDialog }: { onOpenDialog: () => void }) {
  const sectionClasses =
    'flex-1 flex flex-col border-r border-gray-300 cursor-pointer py-1 px-3 hover:bg-gray-50 transition-colors';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDialog();
  };

  return (
    <div
      className="flex flex-row items-center bg-background rounded-full shadow-md border border-gray-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className={sectionClasses}>
        <label className="text-xs font-medium text-gray-600 pointer-events-none">
          Where
        </label>
        <span className="text-sm text-gray-400">Search destinations</span>
      </div>

      <div className={sectionClasses}>
        <label className="text-xs font-medium text-gray-600 pointer-events-none">
          Move In
        </label>
        <span className="text-sm text-gray-400">Add dates</span>
      </div>

      <div className={sectionClasses}>
        <label className="text-xs font-medium text-gray-600 pointer-events-none">
          Move Out
        </label>
        <span className="text-sm text-gray-400">Add dates</span>
      </div>

      <div className="flex-1 flex flex-col py-1 px-3 cursor-pointer hover:bg-gray-50 transition-colors">
        <label className="text-xs font-medium text-gray-600 pointer-events-none">
          Who
        </label>
        <span className="text-sm text-gray-400">Add guests</span>
      </div>

      <div className="flex-shrink-0 p-2">
        <button
          className="w-10 h-10 rounded-full bg-primaryBrand flex items-center justify-center hover:bg-primaryBrand/90 transition-colors"
          onClick={handleClick}
        >
          <FaSearch className="text-white text-sm" />
        </button>
      </div>
    </div>
  );
}

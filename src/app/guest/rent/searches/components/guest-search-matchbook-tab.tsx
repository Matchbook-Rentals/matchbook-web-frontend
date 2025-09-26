import React from 'react';
import { BrandButton } from '@/components/ui/brandButton';

export default function GuestSearchMatchbookTab() {
  const handleSignIn = () => {
    const currentPath = window.location.pathname;
    const redirectUrl = encodeURIComponent(currentPath);
    window.location.href = `/sign-in?redirect_url=${redirectUrl}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] px-6 text-center">
      <img
        src="/search-flow/empty-states/empty-listings.png"
        alt="Sign in required"
        className="w-32 h-32 mb-6 opacity-60"
      />

      <h2 className="font-montserrat-regular text-2xl mb-4">
        Sign in to see your matches
      </h2>

      <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
        Once you have applied you can see your approved applications here and finish booking.
        To apply please sign in and go to the Favorites tab.
      </p>

      <BrandButton
        variant="default"
        onClick={handleSignIn}
      >
        Sign In
      </BrandButton>
    </div>
  );
}
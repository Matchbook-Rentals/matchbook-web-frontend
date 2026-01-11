"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";

interface ReferHostHeroProps {
  isSignedIn: boolean;
  referralCode?: string | null;
}

export const ReferHostHero = ({ isSignedIn, referralCode }: ReferHostHeroProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!referralCode) return;

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://matchbookrentals.com';
    const referralLink = `${baseUrl}/ref/${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-poppins font-medium text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] tracking-[-2px] text-primary-900 mb-4">
          Refer hosts, get rewarded
        </h2>
        <p className="text-base md:text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Receive $50 when a host you refer gets their first booking.{" "}
          <Link href="/terms/referral" className="underline hover:text-primaryBrand">
            Terms apply
          </Link>
        </p>
        {isSignedIn && referralCode ? (
          <Button
            onClick={handleCopyLink}
            className="bg-[#E8F4F4] hover:bg-[#d5eded] text-primaryBrand font-semibold px-10 py-6 text-base rounded-lg"
          >
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        ) : !isSignedIn ? (
          <SignInButton mode="modal">
            <Button className="bg-[#E8F4F4] hover:bg-[#d5eded] text-primaryBrand font-semibold px-10 py-6 text-base rounded-lg">
              Sign In
            </Button>
          </SignInButton>
        ) : (
          // Signed in but no referral code (edge case - loading or error)
          <Button
            disabled
            className="bg-[#E8F4F4] text-primaryBrand font-semibold px-10 py-6 text-base rounded-lg opacity-50"
          >
            Loading...
          </Button>
        )}
      </div>
    </section>
  );
};

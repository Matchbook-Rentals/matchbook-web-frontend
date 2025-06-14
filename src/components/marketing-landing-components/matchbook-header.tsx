'use client'
import { ChevronDownIcon } from "lucide-react";
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { useUser } from "@clerk/nextjs";

export default function MatchbookHeader(): JSX.Element {
  const { user } = useUser();
  
  // Get user's first and last name
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'User';
  
  // Get user role from metadata
  const userRole = user?.publicMetadata?.role as string | undefined;
  const displayRole = userRole 
    ? userRole.replace(/_/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    : 'Member';
  
  // Generate initials for fallback
  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : fullName[0]?.toUpperCase() || 'U';

  return (
    <header className="flex w-full items-center justify-between px-6 py-1 bg-white">
      <div className="relative h-[72px] flex items-center">
        <img className=" w-[200px]" alt="MatchBook Logo" src="/new-green-logo.png" />
      </div>

      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          className="text-[#3c8787] border-[#3c8787] hover:bg-primaryBrand hover:text-white font-medium transition-colors duration-300"
        >
          Become a Host
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-[38px] w-[38px]">
              <AvatarImage src={user?.imageUrl} alt={fullName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="font-text-text-sm-semibold text-black text-[14px] leading-[22px]">
                {fullName}
              </span>
              <span className="font-text-text-sm-regular text-neutral-2 text-[14px] leading-[22px]">
                {displayRole}
              </span>
            </div>
          </div>

          <ChevronDownIcon className="h-6 w-6 text-black" />
        </div>
      </div>
    </header>
  );
}

'use client'
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getNotifications } from '@/app/actions/notifications';
import { Notification } from '@prisma/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function UserMenu({ isSignedIn, color }: { isSignedIn: boolean, color: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      if (isSignedIn) {
        const result = await getNotifications();
        if (result.success && result.notifications) {
          setNotifications(result.notifications);
          setHasUnread(result.notifications.some(notification => notification.unread));
        } else if (!result.success) {
          console.error('Failed to fetch notifications:', result.error);
        }
      }
    }
    fetchNotifications();
  }, [isSignedIn]);

  return (
    <div className="flex items-center scale-125">
      {isSignedIn ? (
        <>
          <Popover>
            <PopoverTrigger className="relative">
              <Image src={`/svg/${color}-hamburger.svg`} alt='menu icon' width={50} height={50} />
              {hasUnread && (
                <div className="absolute top-[5px] right-[5px] w-3 h-3 bg-red-500 rounded-full" />

              )}
            </PopoverTrigger>
            <PopoverContent>
              <div className='flex flex-col'>
                <Link className='hover:bg-primaryBrand border-b-2 p-1 transition-all duration-300' href='/platform/dashboard'>Dashboard</Link>
                <Link className='hover:bg-primaryBrand border-b-2 p-1 transition-all duration-300' href='/platform/host-dashboard'>Host Dashboard</Link>
                <Accordion type="single" collapsible>
                  <AccordionItem value="notifications">
                    <AccordionTrigger className="flex justify-between">
                      <div>
                        Notifications
                        {hasUnread && <span className="text-red-500 ml-2">•</span>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.map((notification, index) => (
                          <div key={index} className="flex items-center py-2">
                            {notification.unread && <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />}
                            <p>{notification.content}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </PopoverContent>
          </Popover>
          <UserButton />
        </>
      ) : (
        <>
          <Popover>
            <PopoverTrigger>
              <Image src={`/svg/${color}-hamburger.svg`} alt='menu icon' width={50} height={50} />
            </PopoverTrigger>
            <PopoverContent className='w-full p-0'>
              <Link href="/sign-in" className='hover:bg-primaryBrand/50 cursor-pointer w-full text-left pl-3 pr-14 border-b border-black'>Sign In</Link>
              <p className='hover:bg-primaryBrand/50 cursor-pointer pl-3'>Get help</p>
            </PopoverContent>
          </Popover>
          <Image src="/svg/account.svg" alt='person icon' width={50} height={50} className='rounded-full border-white border-[3px] pb-1' />
        </>
      )}
    </div>
  )
}


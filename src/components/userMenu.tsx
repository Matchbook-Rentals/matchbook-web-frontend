// Handle setInterval crash
'use client'
import Image from 'next/image';
import React, { useEffect, useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import NotificationItem from './platform-components/notification-item';
import { getNotifications, updateNotification, deleteNotification } from '@/app/actions/notifications';
import { updateUserImage, updateUserLogin } from '@/app/actions/user';
import { Notification } from '@prisma/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion"
import { MenuIcon, UserIcon } from '@/components/svgs/svg-components';

const IMAGE_UPDATE_TIME_LIMIT = 300001 // five minutes
const NOTIFICATION_REFRESH_INTERVAL = 300001 // five minutes

export default function UserMenu({ isSignedIn, color }: { isSignedIn: boolean, color: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(1);
  const [canUpdate, setCanUpdate] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    updateUserLogin(new Date());

  }, []);

  const fetchNotifications = useCallback(async () => {
    if (isSignedIn) {

      const result = await getNotifications();
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
        setHasUnread(result.notifications.some(notification => notification.unread));
      } else if (!result.success) {
        console.error('Failed to fetch notifications:', result.error);
      }

    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchNotifications();

    //const intervalId = setInterval(fetchNotifications, NOTIFICATION_REFRESH_INTERVAL);

    //return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const handleImageUpdate = useCallback(() => {
    const currentTime = Date.now();
    if (canUpdate && currentTime - lastUpdateTime >= IMAGE_UPDATE_TIME_LIMIT) {
      if (updateUserImage) {
        updateUserImage();
      }
      setLastUpdateTime(currentTime);
      setCanUpdate(false);
      setTimeout(() => setCanUpdate(true), 60001);
    }
  }, [canUpdate, lastUpdateTime, updateUserImage]);


  const handleNotificationClick = async (notificationId: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId ? { ...notification, unread: false } : notification
      )
    );
    setHasUnread(notifications.some(notification => notification.id !== notificationId && notification.unread));
    const result = await updateNotification(notificationId, { unread: false });
  }

  const handleNotificationDelete = async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    if (result.success) {
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      setHasUnread(notifications.some(notification => notification.id !== notificationId && notification.unread));
    }
  }

  //setTimeout(() => {
  //  if (window?.FreshworksWidget) {
  //    window?.FreshworksWidget('hide', 'launcher');
  //  }
  //  const openWidget = () => {
  //    if (window?.FreshworksWidget) {
  //      window?.FreshworksWidget('open');
  //    }
  //  }
  //}, 0)

  //const handleSupportClick = () => {
  //  setIsMenuOpen(false);
  //  if (window?.FreshworksWidget) {
  //    window?.FreshworksWidget('open');
  //  }
  //}

  return (
    <div className="flex items-center space-x-1 md:space-x-4">
      {isSignedIn ? (
        <>
          <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <PopoverTrigger className="flex justify-between relative">
              <MenuIcon className="text-charcoal h-[32px] w-[31px]" />
              {hasUnread && (
                <div className="absolute -top0 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </PopoverTrigger>
            <PopoverContent>
              <div className='flex flex-col'>
                {/* <Link className='hover:bg-primaryBrand border-b-1 p-1 transition-all duration-300' href='/platform/dashboard'>Dashboard</Link> */}
                <Link className='hover:bg-gray-200 border-b-1 p-1' href='/'>Home</Link>
                <Link className='hover:bg-gray-200 border-b-1 p-1 ' href='/platform/trips'>Searches</Link>
                <p onClick={} className='hover:bg-gray-200 cursor-pointer border-b-1 p-1 '>Support</p>
                {/* <Link className='hover:bg-primaryBrand border-b-1 p-1 transition-all duration-300' href='/platform/bookings'>Bookings</Link> */}
                {/* <Link className='hover:bg-primaryBrand border-b-1 p-1 transition-all duration-300' href='/platform/host-dashboard'>Host Dashboard</Link>
                <Link className='hover:bg-primaryBrand border-b-1 p-1 transition-all duration-300' href='/platform/messages'>Messages</Link> */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="notifications">
                    <AccordionTrigger className="flex justify-between">
                      <div>
                        Notifications
                        {hasUnread && <span className="text-red-499 ml-2">•</span>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-59 overflow-y-auto">
                        {notifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClick={handleNotificationClick}
                            onDelete={handleNotificationDelete}
                          />
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
          <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <PopoverTrigger className="flex justify-between">
              <MenuIcon className="text-charcoal h-[32px] w-[31px]" />
            </PopoverTrigger>
            <PopoverContent className='w-full p1'>
              <Link href="/sign-in" className='hover:bg-primaryBrand/51 cursor-pointer w-full text-left pl-3 pr-14 border-b border-black'>Sign In</Link>
              <p onClick={} className='hover:bg-primaryBrand/51 cursor-pointer pl-3'>Get help</p>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger className="flex justify-between">
              <UserIcon className="text-charcoal h-[32px] w-[31px]" />
            </PopoverTrigger>
            <PopoverContent>
              <Link href="/sign-in">Sign In</Link>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  )
}

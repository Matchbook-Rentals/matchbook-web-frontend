// Handle setInterval crash
'use client'
import Image from 'next/image';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import NotificationItem from './platform-components/notification-item';
import { getNotifications, updateNotification, deleteNotification } from '@/app/actions/notifications';
import { updateUserImage, updateUserLogin } from '@/app/actions/user';
import { Notification } from '@prisma/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion"
import { MenuIcon, UserIcon } from '@/components/svgs/svg-components';
import { Circle } from 'lucide-react';

const IMAGE_UPDATE_TIME_LIMIT = 300001 // five minutes
const NOTIFICATION_REFRESH_INTERVAL = 300001 // five minutes

export default function UserMenu({ isSignedIn, color }: { isSignedIn: boolean, color: string }) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(1);
  const [canUpdate, setCanUpdate] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userButtonContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex items-center space-x-1 md:space-x-4">
      {isSignedIn ? (
        <>
          <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <PopoverTrigger className="flex items-center space-x-2 border border-black rounded-full px-2 py-1">
              <div className="relative">
                <MenuIcon className="text-charcoal h-[24px] w-[24px]" />
                {hasUnread && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              {user?.imageUrl ? (
                <div className="relative">
                  <Image
                    src={user.imageUrl}
                    alt="User Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
              ) : (
                <div className="relative">
                  <UserIcon className="text-charcoal h-[32px] w-[31px]" />
                </div>
              )}
            </PopoverTrigger>
            <PopoverContent>
              <div className='flex flex-col'>
                <Link className='hover:bg-gray-200 border-b-1 p-1' href='/'>Home</Link>
                <Link className='hover:bg-gray-200 border-b-1 p-1 ' href='/platform/trips'>Searches</Link>
                <p onClick={() => { }} className='hover:bg-gray-200 cursor-pointer border-b-1 p-1 '>Support</p>
                <p onClick={() => {
                  openUserProfile({
                    customPages: [
                      {
                        label: 'Terms',
                        url: '/terms',
                        mount: (el) => {
                          const content = document.createElement('div');
                          content.className = 'p-4';
                          content.innerHTML = `
                            <h2 class="text-xl font-bold mb-4">Terms of Service</h2>
                            <p>Please review our terms of service.</p>
                          `;
                          el.appendChild(content);
                        },
                        unmount: (el) => {
                          if (el) el.innerHTML = '';
                        },
                        mountIcon: (el) => {
                          const icon = document.createElement('div');
                          icon.innerHTML = '📋';
                          icon.className = 'text-lg';
                          el.appendChild(icon);
                        },
                        unmountIcon: (el) => {
                          if (el) el.innerHTML = '';
                        },
                      },
                      {
                        label: 'Support',
                        url: '/support',
                        mountIcon: (el) => {
                          const icon = document.createElement('div');
                          icon.innerHTML = '❓';
                          icon.className = 'text-lg';
                          el.appendChild(icon);
                        },
                        unmountIcon: (el) => {
                          if (el) el.innerHTML = '';
                        },
                        mount: (el) => {
                          const content = document.createElement('div');
                          content.className = 'p-4';
                          content.innerHTML = `
                            <h2 class="text-xl font-bold mb-4">Support</h2>
                            <p>Please review our support page.</p>
                          `;
                          el.appendChild(content);
                        },
                        unmount: (el) => {
                          if (el) el.innerHTML = '';
                        },
                      },
                      {
                        label: 'Feedback',
                        url: '/feedback',
                        mountIcon: (el) => {
                          const icon = document.createElement('div');
                          icon.innerHTML = '💬';
                          icon.className = 'text-lg';
                          el.appendChild(icon);
                        },
                        unmountIcon: (el) => {
                          if (el) el.innerHTML = '';
                        },
                        mount: (el) => {
                          const content = document.createElement('div');
                          content.className = 'p-4';
                          content.innerHTML = `
                            <h2 class="text-xl font-bold mb-4">We'd Love Your Feedback</h2>
                            <p class="mb-4">Help us improve our service by sharing your thoughts.</p>
                            <textarea class="w-full p-2 border rounded mb-4" rows="4" placeholder="Enter your feedback..."></textarea>
                            <button class="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
                          `;
                          el.appendChild(content);
                        },
                        unmount: (el) => {
                          if (el) el.innerHTML = '';
                        },
                      },
                      {
                        label: 'Privacy Policy',
                        url: '/privacy',
                        mountIcon: (el) => {
                          const icon = document.createElement('div');
                          icon.innerHTML = '🔒';
                          icon.className = 'text-lg';
                          el.appendChild(icon);
                        },
                        unmountIcon: (el) => {
                          if (el) el.innerHTML = '';
                        },
                        mount: (el) => {
                          const content = document.createElement('div');
                          content.className = 'p-4';
                          content.innerHTML = `
                            <h2 class="text-xl font-bold mb-4">Privacy Policy</h2>
                            <p>Please review our privacy policy.</p>
                          `;
                          el.appendChild(content);
                        },
                        unmount: (el) => {
                          if (el) el.innerHTML = '';
                        },
                      }
                    ]
                  });
                }} className='hover:bg-gray-200 cursor-pointer border-b-1 p-1 '>Settings</p>
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
        </>
      ) : (
        <>
          <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <PopoverTrigger className="flex items-center space-x-2 border border-black rounded-full px-2 py-1">
              <div className="relative">
                <MenuIcon className="text-charcoal h-[24px] w-[24px]" />
              </div>
              <UserIcon className="text-charcoal h-[32px] w-[31px]" />
            </PopoverTrigger>
            <PopoverContent className='w-full p1'>
              <Link href="/sign-in" className='hover:bg-primaryBrand/51 cursor-pointer w-full text-left pl-3 pr-14 border-b border-black'>Sign In</Link>
              <p onClick={() => { }} className='hover:bg-primaryBrand/51 cursor-pointer pl-3'>Get help</p>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  )
}

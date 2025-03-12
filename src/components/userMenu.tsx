// Handle setInterval crash
'use client'
import Image from 'next/image';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserButton, useUser, useClerk, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationItem from './platform-components/notification-item';
import { getNotifications, updateNotification, deleteNotification } from '@/app/actions/notifications';
import { updateUserImage, updateUserLogin } from '@/app/actions/user';
import { Notification } from '@prisma/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion"
import { MenuIcon, UserIcon } from '@/components/svgs/svg-components';
import { Bell, Circle } from 'lucide-react';

const IMAGE_UPDATE_TIME_LIMIT = 300001 // five minutes
const NOTIFICATION_REFRESH_INTERVAL = 300001 // five minutes

export default function UserMenu({ isSignedIn, color }: { isSignedIn: boolean, color: string }) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(1);
  const [canUpdate, setCanUpdate] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userButtonContainerRef = useRef<HTMLDivElement>(null);
  const userRole = user?.publicMetadata?.role as string | undefined;

  useEffect(() => {
    updateUserLogin(new Date());
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (isSignedIn && (userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user')) {
      const result = await getNotifications();
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
        setHasUnread(result.notifications.some(notification => notification.unread));
      } else if (!result.success) {
        console.error('Failed to fetch notifications:', result.error);
      }
    }
  }, [isSignedIn, userRole]);

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

  const handleSettings = () => {
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
  };

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      {isSignedIn && (userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user') && (
        <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <PopoverTrigger className="relative flex items-center justify-center">
            <Bell className="h-5 w-5 text-charcoal" />
            {hasUnread && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </PopoverTrigger>
          <PopoverContent  className="p-0">
            <div className="w-80 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="px-4 py-3">
                  <h3 className="text-md font-medium">Notifications</h3>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="flex flex-col">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="border-b border-gray-100 last:border-b-0">
                        <NotificationItem
                          notification={notification}
                          onClick={handleNotificationClick}
                          onDelete={handleNotificationDelete}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {isSignedIn ? (
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <PopoverTrigger className="flex items-center space-x-2 border border-black rounded-full px-2 py-1">
            <div className="relative">
              <MenuIcon className="text-charcoal h-[24px] w-[24px]" />
            </div>
            {user?.imageUrl ? (
              <div className="relative">
                <Image
                  src={user.imageUrl}
                  alt="User Profile"
                  width={32}
                  height={32}
                  className="rounded-full aspect-square object-cover object-center"
                />
              </div>
            ) : (
              <div className="relative">
                <UserIcon className="text-charcoal h-[32px] w-[31px]" />
              </div>
            )}
          </PopoverTrigger>
          <PopoverContent  className="p-0">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Core navigation options */}
              <div className="flex flex-col">
                <Link href="/">
                  <button className="px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 w-full">Home</button>
                </Link>

                {/* Role-specific links */}
                {(userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user') && (
                  <Link href="/platform/trips">
                    <button className="px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 w-full">Searches</button>
                  </Link>
                )}

                <Link href="/platform/application">
                  <button className="px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 w-full">Application</button>
                </Link>

                <Link href="/">
                  <button className="px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 w-full">Bookings</button>
                </Link>
              </div>

              {/* Messages section */}
              <div className="border-t border-gray-200">
                {userRole === 'admin' && (
                  <Link href="/platform/messages">
                    <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Inbox</button>
                  </Link>
                )}
              </div>

              {/* Host switch */}
              <div className="border-t border-gray-200">
                <Link href="/">
                  <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">
                    Switch to Hosting
                  </button>
                </Link>
              </div>

              {/* Beta access notice */}
              {!userRole && (
                <div className="border-t border-gray-200">
                  <div className="w-full px-4 py-3 text-left text-sm font-medium text-gray-500">Beta access coming soon!</div>
                </div>
              )}

              {/* Settings, support, and admin section */}
              <div className="border-t border-gray-200">
                <button
                  onClick={() => handleSettings()}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Settings
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Support
                </button>
                {userRole === 'admin' && (
                  <Link href="/admin">
                    <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Admin Dashboard</button>
                  </Link>
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200">
                <SignOutButton>
                  <button
                    onClick={() => {}}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <PopoverTrigger className="flex items-center space-x-2 border border-black rounded-full px-2 py-1">
            <div className="relative">
              <MenuIcon className="text-charcoal h-[24px] w-[24px]" />
            </div>
            <UserIcon className="text-charcoal h-[32px] w-[31px]" />
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0">
            <div className="w-48 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col">
                <Link href="/sign-in">
                  <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Sign In</button>
                </Link>
                <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Get help</button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

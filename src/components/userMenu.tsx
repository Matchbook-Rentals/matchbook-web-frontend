// Handle setInterval crash
'use client'
import Image from 'next/image';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserButton, useUser, useClerk, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import NotificationItem from './platform-components/notification-item';
import { getNotifications, updateNotification, deleteNotification } from '@/app/actions/notifications';
import { updateUserImage, updateUserLogin } from '@/app/actions/user';
import { Notification } from '@prisma/client';
import { MenuIcon, UserIcon } from '@/components/svgs/svg-components';
import { Bell } from 'lucide-react';
import { SupportDialog } from '@/components/ui/support-dialog';

const IMAGE_UPDATE_TIME_LIMIT = 300000 // five minutes
const NOTIFICATION_REFRESH_INTERVAL = 60000 // five minutes

// Define the structure for menu items
interface MenuItem {
  id: string;
  label: string | ((pathname: string) => string);
  href?: string | ((pathname: string) => string);
  onClick?: () => void;
  requiresBeta?: boolean; // Requires beta_user, moderator, or admin
  requiresAdmin?: boolean; // Requires admin
  adminOnlyVisible?: boolean; // Only visible to admin
  section: number; // For grouping and dividers
}

export default function UserMenu({ isSignedIn, color }: { isSignedIn: boolean, color: string }) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(1);
  const [canUpdate, setCanUpdate] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const userButtonContainerRef = useRef<HTMLDivElement>(null);
  
  // Determine user roles and access levels
  const userRole = user?.publicMetadata?.role as string | undefined;
  const hasBetaAccess = userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user';
  const isAdmin = userRole === 'admin'; // Use actual admin role check

  useEffect(() => {
    updateUserLogin(new Date());
  }, []);

  // Define the menu structure
  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Home', href: '/', section: 1 },
    { id: 'searches', label: 'Searches', href: '/platform/trips', requiresBeta: true, section: 1 },
    { id: 'application', label: 'Application', href: '/platform/application', requiresBeta: true, section: 1 },
    { id: 'bookings', label: 'Bookings', href: '/platform/bookings', requiresBeta: true, section: 1 },
    { id: 'inbox', label: 'Inbox', href: '/platform/messages', requiresBeta: true, section: 2 }, // Changed from adminOnlyVisible for consistency with previous logic
    {
      id: 'switch-mode',
      label: (pathname) => pathname.startsWith('/platform/host-dashboard') ? 'Switch to Renting' : 'Switch to Hosting',
      href: (pathname) => pathname.startsWith('/platform/host-dashboard') ? '/platform/bookings' : '/platform/host-dashboard',
      requiresAdmin: true,
      section: 3
    },
    { id: 'settings', label: 'Settings', onClick: () => { handleSettings(); setIsMenuOpen(false); }, section: 4 },
    { id: 'support', label: 'Support', onClick: () => { setIsSupportOpen(true); setIsMenuOpen(false); }, section: 4 },
    { id: 'verification', label: 'Verification', href: '/platform/verification', requiresAdmin: true, section: 4 }, // Changed from adminOnlyVisible
    { id: 'admin-dashboard', label: 'Admin Dashboard', href: '/admin', adminOnlyVisible: true, section: 4 },
  ];

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

  const handleImageUpdate = useCallback(() => {
    const currentTime = Date.now();
    if (canUpdate && currentTime - lastUpdateTime >= IMAGE_UPDATE_TIME_LIMIT) {
      updateUserImage();
      setLastUpdateTime(currentTime);
      setCanUpdate(false);
      setTimeout(() => setCanUpdate(true), 60000); // One minute cooldown
    }
  }, [canUpdate, lastUpdateTime]);
  
  // Periodically update notifications and user image
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    handleImageUpdate();

    // Set up periodic updates
    const notificationIntervalId = setInterval(fetchNotifications, NOTIFICATION_REFRESH_INTERVAL);
    const imageUpdateIntervalId = setInterval(handleImageUpdate, IMAGE_UPDATE_TIME_LIMIT);

    // Clean up on unmount
    return () => {
      clearInterval(notificationIntervalId);
      clearInterval(imageUpdateIntervalId);
    };
  }, [fetchNotifications, handleImageUpdate]);


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
    //  customPages: [
    //    {
    //      label: 'Terms',
    //      url: '/terms',
    //      mount: (el) => {
    //        const content = document.createElement('div');
    //        content.className = 'p-4';
    //        content.innerHTML = `
    //          <h2 class="text-xl font-bold mb-4">Terms of Service</h2>
    //          <p>Please review our terms of service.</p>
    //        `;
    //        el.appendChild(content);
    //      },
    //      unmount: (el) => {
    //        if (el) el.innerHTML = '';
    //      },
    //      mountIcon: (el) => {
    //        const icon = document.createElement('div');
    //        icon.innerHTML = '📋';
    //        icon.className = 'text-lg';
    //        el.appendChild(icon);
    //      },
    //      unmountIcon: (el) => {
    //        if (el) el.innerHTML = '';
    //      },
    //    },
    //    {
    //      label: 'Support',
    //      url: '/support',
    //      mountIcon: (el) => {
    //        const icon = document.createElement('div');
    //        icon.innerHTML = '❓';
    //        icon.className = 'text-lg';
    //        el.appendChild(icon);
    //      },
    //      unmountIcon: (el) => {
    //        if (el) el.innerHTML = '';
    //      },
    //      mount: (el) => {
    //        const content = document.createElement('div');
    //        content.className = 'p-4';
    //        content.innerHTML = `
    //          <h2 class="text-xl font-bold mb-4">Support</h2>
    //          <p>Please review our support page.</p>
    //        `;
    //        el.appendChild(content);
    //      },
    //      unmount: (el) => {
    //        if (el) el.innerHTML = '';
    //      },
    //    },
    //    {
    //      label: 'Feedback',
    //      url: '/feedback',
    //      mountIcon: (el) => {
    //        const icon = document.createElement('div');
    //        icon.innerHTML = '💬';
    //        icon.className = 'text-lg';
    //        el.appendChild(icon);
    //      },
    //      unmountIcon: (el) => {
    //        if (el) el.innerHTML = '';
    //      },
    //      mount: (el) => {
    //        const content = document.createElement('div');
    //        content.className = 'p-4';
    //        content.innerHTML = `
    //          <h2 class="text-xl font-bold mb-4">We'd Love Your Feedback</h2>
    //          <p class="mb-4">Help us improve our service by sharing your thoughts.</p>
    //          <textarea class="w-full p-2 border rounded mb-4" rows="4" placeholder="Enter your feedback..."></textarea>
    //          <button class="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
    //        `;
    //        el.appendChild(content);
    //      },
    //      unmount: (el) => {
    //        if (el) el.innerHTML = '';
    //      },
    //    },
    //    {
    //      label: 'Privacy Policy',
    //      url: '/privacy',
    //      mountIcon: (el) => {
    //        const icon = document.createElement('div');
    //        icon.innerHTML = '🔒';
    //        icon.className = 'text-lg';
    //        el.appendChild(icon);
    //      },
    //      unmountIcon: (el) => {
    //        if (el) el.innerHTML = '';
    //      },
    //      mount: (el) => {
    //        const content = document.createElement('div');
    //        content.className = 'p-4';
    //        content.innerHTML = `
    //          <h2 class="text-xl font-bold mb-4">Privacy Policy</h2>
    //          <p>Please review our privacy policy.</p>
    //        `;
    //        el.appendChild(content);
    //      },
    //      unmount: (el) => {
    //        if (el) el.innerHTML = '';
    //      },
    //    }
    //  ]
    });
  };

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      {/* Notifications Icon - Requires beta access */}
      {isSignedIn && hasBetaAccess && (
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
          <PopoverTrigger className="flex items-center space-x-2 border border-gray-500 rounded-full px-2 py-1 min-w-[80px]">
            <div className="relative">
              <MenuIcon className="text-charcoal h-[24px] w-[24px]" />
            </div>
            {user?.imageUrl ? (
              <div className="relative min-w-[32px] min-h-[32px]">
                <Image
                  src={user.imageUrl}
                  alt="User Profile"
                  width={32}
                  height={32}
                  className="rounded-full aspect-square object-cover object-center min-w-[32px] min-h-[32px]"
                />
              </div>
            ) : (
              <div className="relative min-w-[32px] min-h-[32px]">
                <UserIcon className="text-charcoal h-[32px] w-[32px]" />
              </div>
            )}
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Render menu items from the structure */}
              {(() => {
                let lastSection = 0;
                return menuItems.map((item) => {
                  // Visibility Check: Skip rendering if adminOnlyVisible and user is not admin
                  if (item.adminOnlyVisible && !isAdmin) {
                    return null;
                  }

                  // Enabled Check
                  let isItemEnabled = true;
                  if (item.requiresBeta && !hasBetaAccess) {
                    isItemEnabled = false;
                  }
                  if (item.requiresAdmin && !isAdmin) {
                    isItemEnabled = false;
                  }

                  // Determine dynamic label and href
                  const label = typeof item.label === 'function' ? item.label(pathname || '') : item.label;
                  const href = typeof item.href === 'function' ? item.href(pathname || '') : item.href;

                  const sectionChanged = item.section !== lastSection;
                  lastSection = item.section; // Update lastSection for the next iteration

                  const buttonContent = (
                    <button
                      onClick={item.onClick ? item.onClick : () => setIsMenuOpen(false)}
                      className={`w-full px-4 py-3 text-left text-sm font-medium ${
                        isItemEnabled
                          ? 'text-gray-800 hover:bg-gray-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!isItemEnabled}
                    >
                      {label}
                    </button>
                  );

                  return (
                    <React.Fragment key={item.id}>
                      {sectionChanged && lastSection > 1 && <div className="border-t border-gray-200" />}
                      {href && isItemEnabled ? (
                        <Link href={href} passHref>
                          {buttonContent}
                        </Link>
                      ) : (
                        buttonContent
                      )}
                    </React.Fragment>
                  );
                }).filter(Boolean); // Filter out null values from skipped items
              })()}

              {/* Beta access notice - Show only if user doesn't have beta access */}
              {!hasBetaAccess && (
                <div className="border-t border-gray-200">
                  <div className="w-full px-4 py-3 text-left text-sm font-medium text-gray-500">Beta access coming soon!</div>
                </div>
              )}

              {/* Logout */}
              <div className="border-t border-gray-200">
                <SignOutButton>
                  <button
                    onClick={() => {}}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <PopoverTrigger className="flex items-center space-x-2 border border-gray-500 rounded-full px-2 py-1 min-w-[80px]">
            <div className="relative">
              <MenuIcon className="text-charcoal h-[24px] w-[24px]" />
            </div>
            <div className="relative min-w-[32px] min-h-[32px]">
              <UserIcon className="text-charcoal h-[32px] w-[32px]" />
            </div>
          </PopoverTrigger>
          <PopoverContent  className="p-0">
            <div className=" rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col">
                <Link href="/sign-in">
                  <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Sign In</button>
                </Link>
                <button onClick={() => setIsSupportOpen(true)} className=" px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">Get help</button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <SupportDialog open={isSupportOpen} onOpenChange={setIsSupportOpen} />
    </div>
  )
}

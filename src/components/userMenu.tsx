'use client'
import { ChevronDownIcon, Bell, UserRound, Loader2 } from "lucide-react";
import { FaUserLarge } from "react-icons/fa6";
import React, { useEffect, useState, useCallback } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClerk, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import NotificationItem from "./platform-components/notification-item";
import { getNotifications, updateNotification, deleteNotification } from "@/app/actions/notifications";
import { updateUserImage, updateUserLogin } from "@/app/actions/user";
import { Notification } from "@prisma/client";
import { SupportDialog } from "@/components/ui/support-dialog";
import { checkClientBetaAccess, checkClientHostAccess } from "@/utils/client-roles";
import { MenuIcon, UserIcon } from "@/components/svgs/svg-components";

const NOTIFICATION_REFRESH_INTERVAL = 60000; // one minute

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

// Define the structure for menu items
interface MenuItem {
  id: string;
  label: string | ((pathname: string) => string);
  href?: string | ((pathname: string) => string);
  onClick?: () => void;
  requiresBeta?: boolean; // Requires beta_user, moderator, or admin
  requiresAdmin?: boolean; // Requires admin
  requiresPreview?: boolean; // Requires preview
  requiresHostAccess?: boolean; // Requires host_beta, moderator, or admin
  adminOnlyVisible?: boolean; // Only visible to admin
  section: number; // For grouping and dividers
}

interface UserMenuProps {
  color: string;
  mode?: 'header' | 'menu-only';
  userId?: string | null;
  user?: UserObject | null;
  isSignedIn?: boolean;
  hasListings?: boolean;
}

export default function UserMenu({ color, mode = 'menu-only', userId, user, isSignedIn, hasListings }: UserMenuProps): JSX.Element {
  const { openUserProfile } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  // Get user's first name only, truncate after 10 characters
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const displayText = firstName || user?.emailAddresses?.[0]?.emailAddress || 'User';
  const fullName = displayText.length > 10 ? displayText.substring(0, 10) + '...' : displayText;
  
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

  // Determine user roles and access levels
  const hasBetaAccess = checkClientBetaAccess(userRole);
  const hasHostAccess = checkClientHostAccess(userRole);
  const isAdmin = userRole?.includes('admin') || false; // Allow both 'admin' and 'admin_dev'
  const isPreview = userRole === 'preview'; // Preview role has access to everything except admin

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // TODO: Session tracking now handled in middleware
  // useEffect(() => {
  //   updateUserLogin(new Date());
  // }, []);

  const fetchNotifications = useCallback(async () => {
    if (user) {
      try {
        const result = await getNotifications();
        if (result.success && Array.isArray(result.notifications)) {
          setNotifications(result.notifications);
          setHasUnread(result.notifications.some(notification => notification.unread));
        } else if (result.success && !Array.isArray(result.notifications)) {
          console.error('Failed to fetch notifications: notifications data is not an array.', result);
          setNotifications([]);
          setHasUnread(false);
        } else if (!result.success) {
          console.error('Failed to fetch notifications:', result.error);
        }
      } catch (error) {
        console.error('An error occurred while fetching notifications:', error);
      }
    }
  }, [user, userRole]);

  // Periodically update notifications
  useEffect(() => {
    fetchNotifications();
    const notificationIntervalId = setInterval(fetchNotifications, NOTIFICATION_REFRESH_INTERVAL);
    return () => {
      clearInterval(notificationIntervalId);
    };
  }, [fetchNotifications]);


  // Use passed props or default values
  const currentIsSignedIn = isSignedIn !== undefined ? isSignedIn : false;
  const isLoaded = true;

  // Check if user is on host side - either by path or by view=host parameter
  const isHostSide = pathname?.startsWith('/app/host/') ||
                     searchParams.get('view') === 'host';


  // Define the menu structure with conditional items based on host/renter side
  const menuItems: MenuItem[] = isHostSide ? [
    // Host side menu items - now open to all users
    // No longer requiring host-beta access
    { id: 'home', label: 'Home', href: '/', section: 1 },
    { id: 'overview', label: 'Overview', href: '/app/host/dashboard/overview', section: 1 },
    { id: 'all-listings', label: 'All Listings', href: '/app/host/dashboard/listings', section: 1 },
    { id: 'inbox', label: 'Inbox', href: '/app/rent/messages?view=host', section: 2 },
    {
      id: 'switch-mode',
      label: 'Switch to Renting',
      href: '/app/rent/searches',
      section: 3
    },
    { id: 'settings', label: 'Settings', onClick: () => { handleSettings(); setIsMenuOpen(false); }, section: 4 },
    { id: 'support', label: 'Support', onClick: () => { setIsSupportOpen(true); setIsMenuOpen(false); }, section: 4 },
    { id: 'admin-dashboard', label: 'Admin Dashboard', href: '/admin', adminOnlyVisible: true, section: 4 },
  ] : [
    // Renter side menu items - open to all users
    { id: 'home', label: 'Home', href: '/', section: 1 },
    { id: 'searches', label: 'Searches', href: '/app/rent/searches', section: 1 },
    { id: 'application', label: 'Applications', href: '/app/rent/applications', section: 1 },
    { id: 'bookings', label: 'Bookings', href: '/app/rent/bookings', section: 1 },
    { id: 'inbox', label: 'Inbox', href: '/app/rent/messages', section: 2 },
    {
      id: 'switch-mode',
      label: hasListings === false ? 'List your property' : 'Switch to Hosting',
      href: hasListings === false ? '/app/host/add-property' : '/app/host/dashboard/overview',
      section: 3
    },
    { id: 'settings', label: 'Settings', onClick: () => { handleSettings(); setIsMenuOpen(false); }, section: 4 },
    { id: 'support', label: 'Support', onClick: () => { setIsSupportOpen(true); setIsMenuOpen(false); }, section: 4 },
    { id: 'verification', label: 'MatchBook Renter Verification', href: '/verification', section: 4 },
    { id: 'refer-host', label: 'Refer a Host - Earn $50', href: '/refer-host', section: 4 },
    { id: 'admin-dashboard', label: 'Admin Dashboard', href: '/admin', adminOnlyVisible: true, section: 4 },
  ];

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
    const isAdminDev = userRole?.includes('admin');

    openUserProfile({
      customPages: [
        {
          label: 'Notifications',
          url: '/notifications',
          mount: async (el) => {
            const content = document.createElement('div');
            content.className = 'p-4';

            const toggleHTML = (id: string, label: string, description: string) => `
              <div class="flex items-center justify-between py-2">
                <div>
                  <label class="text-sm font-medium text-gray-900">${label}</label>
                  <p class="text-xs text-gray-500">${description}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer notification-toggle" id="${id}" data-pref="${id}">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            `;

            content.innerHTML = `
              <h2 class="text-xl font-bold mb-4">Email Notification Settings</h2>
              ${!isAdminDev ? '<p class="text-sm text-gray-600 mb-4">Notification preferences will be available soon.</p>' : ''}
              <div id="loading-state" class="text-center py-4">
                <div class="flex justify-center">
                  <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p class="text-sm text-gray-500 mt-2">Loading preferences...</p>
              </div>
              <div id="notification-settings" class="space-y-6 hidden">
                ${isAdminDev ? `
                  <div class="space-y-3">
                    <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Messages & Communication</h3>
                    ${toggleHTML('emailNewMessageNotifications', 'New Message', 'Get notified when you receive new messages')}
                    ${toggleHTML('emailNewConversationNotifications', 'New Conversation', 'Get notified when someone starts a conversation with you')}
                  </div>

                  <div class="space-y-3">
                    <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Applications & Matching</h3>
                    ${toggleHTML('emailApplicationReceivedNotifications', 'Application Received', 'Get notified when you receive a new application (hosts)')}
                    ${toggleHTML('emailApplicationApprovedNotifications', 'Application Approved', 'Get notified when your application is approved')}
                    ${toggleHTML('emailApplicationDeclinedNotifications', 'Application Declined', 'Get notified when your application is declined')}
                  </div>

                  <div class="space-y-3">
                    <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Bookings & Stays</h3>
                    ${toggleHTML('emailBookingCompletedNotifications', 'Booking Completed', 'Get notified when a booking is completed')}
                    ${toggleHTML('emailBookingCanceledNotifications', 'Booking Canceled', 'Get notified when a booking is canceled')}
                    ${toggleHTML('emailMoveInUpcomingNotifications', 'Move-In Upcoming', 'Get notified about upcoming move-in dates')}
                    ${toggleHTML('emailMoveOutUpcomingNotifications', 'Move-Out Upcoming', 'Get notified about upcoming move-out dates')}
                  </div>

                  <div class="space-y-3">
                    <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Payments</h3>
                    ${toggleHTML('emailPaymentSuccessNotifications', 'Payment Success', 'Get notified when payments are successful')}
                    ${toggleHTML('emailPaymentFailedNotifications', 'Payment Failed', 'Get notified when payments fail')}
                  </div>

                  <div class="space-y-3">
                    <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Reviews & Verification</h3>
                    ${toggleHTML('emailSubmitHostReviewNotifications', 'Host Review Prompt', 'Get reminded to review your guests')}
                    ${toggleHTML('emailSubmitRenterReviewNotifications', 'Renter Review Prompt', 'Get reminded to review your host')}
                    ${toggleHTML('emailLandlordInfoRequestNotifications', 'Landlord Info Request', 'Get notified about landlord info requests')}
                    ${toggleHTML('emailVerificationCompletedNotifications', 'Verification Completed', 'Get notified when verification is complete')}
                  </div>

                  <div class="space-y-3">
                    <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">External Communications</h3>
                    ${toggleHTML('emailOffPlatformHostNotifications', 'Off Platform Host', 'Get notified about off-platform host communications')}
                  </div>
                ` : ''}
              </div>
              <div id="error-state" class="text-center py-4 hidden">
                <p class="text-sm text-red-500">Failed to load notification preferences. Please try again.</p>
              </div>
            `;
            el.appendChild(content);

            if (!isAdminDev) {
              content.querySelector('#loading-state')?.classList.add('hidden');
              return;
            }

            try {
              const response = await fetch('/api/user/notification-preferences');
              const data = await response.json();

              if (data.success && data.preferences) {
                // Set all toggle states based on preferences
                Object.keys(data.preferences).forEach((key) => {
                  const toggle = content.querySelector(`#${key}`) as HTMLInputElement;
                  if (toggle) {
                    toggle.checked = data.preferences[key] === true;
                  }
                });

                // Add change listeners to all toggles
                content.querySelectorAll('.notification-toggle').forEach((toggle) => {
                  toggle.addEventListener('change', async (e) => {
                    const target = e.target as HTMLInputElement;
                    const prefKey = target.getAttribute('data-pref');
                    if (!prefKey) return;

                    try {
                      const updateResponse = await fetch('/api/user/notification-preferences', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ [prefKey]: target.checked })
                      });

                      if (!updateResponse.ok) {
                        console.error('Failed to update preference');
                        // Revert the toggle
                        target.checked = !target.checked;
                      }
                    } catch (error) {
                      console.error('Error updating preference:', error);
                      // Revert the toggle
                      target.checked = !target.checked;
                    }
                  });
                });

                content.querySelector('#loading-state')?.classList.add('hidden');
                content.querySelector('#notification-settings')?.classList.remove('hidden');
              } else {
                content.querySelector('#loading-state')?.classList.add('hidden');
                content.querySelector('#error-state')?.classList.remove('hidden');
              }
            } catch (error) {
              console.error('Error loading notification preferences:', error);
              content.querySelector('#loading-state')?.classList.add('hidden');
              content.querySelector('#error-state')?.classList.remove('hidden');
            }
          },
          unmount: (el) => {
            if (el) el.innerHTML = '';
          },
          mountIcon: (el) => {
            const icon = document.createElement('div');
            icon.innerHTML = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>`;
            icon.className = 'text-lg flex items-center justify-center';
            el.appendChild(icon);
          },
          unmountIcon: (el) => {
            if (el) el.innerHTML = '';
          },
        }
      ]
    });
  };

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      {/* Notifications Icon - Available to all users */}
      {currentIsSignedIn && (
        <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <PopoverTrigger className="relative flex items-center justify-center">
            <Bell className="h-5 w-5 text-charcoal transition-transform duration-300 ease-out " />
            {hasUnread && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </PopoverTrigger>
          <PopoverContent className="p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="px-4 py-3">
                  <h3 className="text-md font-medium">Notifications</h3>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto overflow-x-hidden">
                {notifications.length > 0 ? (
                  <div className="flex flex-col">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="border-b w-full border-gray-100 last:border-b-0">
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

      <div className="group">
        {currentIsSignedIn ? (
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <PopoverTrigger data-testid="user-menu-trigger" className={mode === 'header' ? "flex items-center gap-2 rounded-md pl-2 cursor-pointer" : "flex items-center space-x-2 border border-gray-500 rounded-full px-2 py-1 min-w-[80px]"}>
            {mode === 'header' ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-[38px] w-[38px] transition-transform duration-300 ease-out group-hover:">
                    <AvatarImage src={user?.imageUrl} alt={fullName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <span className="font-text-text-sm-semibold text-black text-left text-[14px] leading-[22px]">
                      {fullName}
                    </span>
                    <span className="font-text-text-sm-regular text-black/50 text-left text-[14px] leading-[22px]">
                      {pathname?.includes('host') ? 'Hosting' : 'Renting'}
                    </span>
                  </div>
                </div>
                <ChevronDownIcon className="h-6 w-6 text-black/30 transition-colors duration-300 ease-out group-hover:text-black" />
              </>
            ) : (
              <>
                <div className="relative">
                  <MenuIcon className="text-charcoal h-[24px] w-[24px]" />
                </div>
                {user?.imageUrl ? (
                  <div className="relative min-w-[32px] min-h-[32px]">
                    <Avatar className="h-[32px] w-[32px] transition-transform duration-300 ease-out group-hover:scale-110">
                      <AvatarImage src={user.imageUrl} alt="User Profile" />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <div className="relative min-w-[32px] min-h-[32px]">
                    <UserIcon className="text-charcoal h-[32px] w-[32px]" />
                  </div>
                )}
              </>
            )}
          </PopoverTrigger>
          <PopoverContent className="p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div 
              className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  const focusableElements = e.currentTarget.querySelectorAll('a, button:not(:disabled)');
                  const currentIndex = Array.from(focusableElements).findIndex(el => el === document.activeElement);
                  
                  let nextIndex;
                  if (e.key === 'ArrowDown') {
                    nextIndex = currentIndex + 1 >= focusableElements.length ? 0 : currentIndex + 1;
                  } else {
                    nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
                  }
                  
                  (focusableElements[nextIndex] as HTMLElement)?.focus();
                }
              }}
            >
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
                  if (item.requiresAdmin && item.requiresPreview) {
                    // If both requiresAdmin and requiresPreview are true, allow if user is either admin OR preview
                    isItemEnabled = isAdmin || isPreview;
                  } else if (item.requiresAdmin && !isAdmin) {
                    isItemEnabled = false;
                  } else if (item.requiresPreview && !isPreview) {
                    isItemEnabled = false;
                  }
                  if (item.requiresHostAccess && !hasHostAccess) {
                    isItemEnabled = false;
                  }

                  // Determine dynamic label and href
                  const label = typeof item.label === 'function' ? item.label(pathname || '') : item.label;
                  const href = typeof item.href === 'function' ? item.href(pathname || '') : item.href;

                  const sectionChanged = item.section !== lastSection;
                  lastSection = item.section; // Update lastSection for the next iteration

                  return (
                    <React.Fragment key={item.id}>
                      {sectionChanged && lastSection > 1 && <div className="border-t border-gray-200" />}
                      {href && isItemEnabled ? (
                        <Link 
                          href={href} 
                          className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {label}
                        </Link>
                      ) : (
                        <button
                          onClick={item.onClick ? item.onClick : () => setIsMenuOpen(false)}
                          className={`w-full px-4 py-3 text-left text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset ${
                            isItemEnabled
                              ? 'text-gray-800 hover:bg-gray-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!isItemEnabled}
                        >
                          {label}
                        </button>
                      )}
                    </React.Fragment>
                  );
                }).filter(Boolean); // Filter out null values from skipped items
              })()}


              {/* Logout */}
              <div className="border-t border-gray-200">
                <SignOutButton>
                  <button
                    data-testid="sign-out-button"
                    onClick={() => {}}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
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
          <PopoverTrigger data-testid="user-menu-trigger" className="flex items-center gap-2 rounded-md p-2 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative min-w-[38px] min-h-[38px] rounded-full flex items-end justify-center overflow-hidden transition-transform duration-300 ease-out group-hover:scale-110" style={{backgroundColor: '#0B6E6E'}}>
                <FaUserLarge className="text-white h-[24px] w-[24px]" />
              </div>

              <div className="flex flex-col">
                <span className="font-text-text-sm-semibold text-black text-[14px] leading-[22px]">
                  Sign In                </span>
                <span className="font-text-text-sm-regular text-black/50 text-left text-[14px] leading-[22px]">
                </span>
              </div>
            </div>
            <ChevronDownIcon className="h-6 w-6 text-black/30 transition-colors duration-300 ease-out group-hover:text-black" />
          </PopoverTrigger>
          <PopoverContent className="p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    const currentPath = window.location.pathname;
                    const redirectUrl = encodeURIComponent(currentPath);
                    window.location.href = `/sign-in?redirect_url=${redirectUrl}`;
                  }}
                  data-testid="sign-in-button"
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                >
                  Sign In
                </button>
                <Link
                  href="/refer-host"
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Refer a Host - Earn $50
                </Link>
                <button onClick={() => setIsSupportOpen(true)} className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset">
                  Get help
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        )}
      </div>

      <SupportDialog open={isSupportOpen} onOpenChange={setIsSupportOpen} />
    </div>
  );
}

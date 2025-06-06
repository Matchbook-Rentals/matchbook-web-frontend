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
  const hasBetaAccess = userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta';
  const isAdmin = userRole === 'admin'; // Use actual admin role check

  useEffect(() => {
    updateUserLogin(new Date());
  }, []);

  // Check if user is on host side
  const isHostSide = pathname?.startsWith('/platform/host-dashboard') || pathname?.startsWith('/platform/host/');

  // Define the menu structure with conditional items based on host/renter side
  const menuItems: MenuItem[] = isHostSide ? [
    // Host side menu items
    { id: 'home', label: 'Home', href: '/', section: 1 },
    { id: 'properties', label: 'Your Properties', href: '/platform/host-dashboard', requiresBeta: true, section: 1 },
    { id: 'applications', label: 'Applications', href: '/platform/host/applications', requiresBeta: true, section: 1 },
    { id: 'bookings', label: 'Bookings', href: '/platform/host/bookings', requiresBeta: true, section: 1 },
    { id: 'inbox', label: 'Inbox', href: '/platform/messages', requiresBeta: true, section: 2 },
    {
      id: 'switch-mode',
      label: 'Switch to Renting',
      href: '/platform/trips',
      requiresBeta: true,
      section: 3
    },
    { id: 'settings', label: 'Settings', onClick: () => { handleSettings(); setIsMenuOpen(false); }, section: 4 },
    { id: 'support', label: 'Support', onClick: () => { setIsSupportOpen(true); setIsMenuOpen(false); }, section: 4 },
    { id: 'admin-dashboard', label: 'Admin Dashboard', href: '/admin', adminOnlyVisible: true, section: 4 },
  ] : [
    // Renter side menu items
    { id: 'home', label: 'Home', href: '/', section: 1 },
    { id: 'searches', label: 'Searches', href: '/platform/trips', requiresBeta: true, section: 1 },
    { id: 'application', label: 'Application', href: '/platform/application', requiresAdmin: true, section: 1 },
    { id: 'bookings', label: 'Bookings', href: '/platform/bookings', requiresBeta: true, section: 1 },
    { id: 'inbox', label: 'Inbox', href: '/platform/messages', requiresBeta: true, section: 2 },
    {
      id: 'switch-mode',
      label: 'Switch to Hosting',
      href: '/platform/host-dashboard',
      requiresBeta: true,
      section: 3
    },
    { id: 'settings', label: 'Settings', onClick: () => { handleSettings(); setIsMenuOpen(false); }, section: 4 },
    { id: 'support', label: 'Support', onClick: () => { setIsSupportOpen(true); setIsMenuOpen(false); }, section: 4 },
    { id: 'verification', label: 'Verification', href: '/platform/verification', requiresAdmin: true, section: 4 },
    { id: 'admin-dashboard', label: 'Admin Dashboard', href: '/admin', adminOnlyVisible: true, section: 4 },
  ];

  const fetchNotifications = useCallback(async () => {
    if (isSignedIn && (userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta')) {
      try {
        const result = await getNotifications();
        if (result.success && Array.isArray(result.notifications)) {
          setNotifications(result.notifications);
          setHasUnread(result.notifications.some(notification => notification.unread));
        } else if (result.success && !Array.isArray(result.notifications)) {
          // This case handles when success is true but notifications is not an array
          console.error('Failed to fetch notifications: notifications data is not an array.', result);
          // Optionally, set notifications to empty array or handle as an error state
          setNotifications([]);
          setHasUnread(false);
        } else if (!result.success) {
          console.error('Failed to fetch notifications:', result.error);
        }
      } catch (error) {
        console.error('An error occurred while fetching notifications:', error);
        // Optionally, set notifications to empty array or handle as an error state
        // setNotifications([]);
        // setHasUnread(false);
      }
    }
  }, [isSignedIn, userRole]);

  // const handleImageUpdate = useCallback(() => {
  //   const currentTime = Date.now();
  //   if (canUpdate && currentTime - lastUpdateTime >= IMAGE_UPDATE_TIME_LIMIT) {
  //     updateUserImage();
  //     setLastUpdateTime(currentTime);
  //     setCanUpdate(false);
  //     setTimeout(() => setCanUpdate(true), 60000); // One minute cooldown
  //   }
  // }, [canUpdate, lastUpdateTime]);
  
  // Periodically update notifications and user image
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    //handleImageUpdate();

    // Set up periodic updates
    const notificationIntervalId = setInterval(fetchNotifications, NOTIFICATION_REFRESH_INTERVAL);
    // const imageUpdateIntervalId = setInterval(handleImageUpdate, IMAGE_UPDATE_TIME_LIMIT);

    // Clean up on unmount
    return () => {
      clearInterval(notificationIntervalId);
      // clearInterval(imageUpdateIntervalId);
    };
  }, [fetchNotifications]);


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
          label: 'Notifications',
          url: '/notifications',
          mount: async (el) => {
            const content = document.createElement('div');
            content.className = 'p-4';
            
            // Create initial HTML structure
            content.innerHTML = `
              <h2 class="text-xl font-bold mb-4">Email Notification Settings</h2>
              <div id="loading-state" class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p class="text-sm text-gray-500 mt-2">Loading preferences...</p>
              </div>
              <div id="notification-settings" class="space-y-6 hidden">
                
                <!-- Messages & Communication -->
                <div class="space-y-3">
                  <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Messages & Communication</h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">New Message</label>
                      <p class="text-xs text-gray-500">Get notified when you receive new messages</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="new-message-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">New Conversation</label>
                      <p class="text-xs text-gray-500">Get notified when someone starts a new conversation with you</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="new-conversation-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <!-- Applications & Matching -->
                <div class="space-y-3">
                  <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Applications & Matching</h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">New Application Received</label>
                      <p class="text-xs text-gray-500">Get notified when you receive new rental applications</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="application-received-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Application Approved</label>
                      <p class="text-xs text-gray-500">Get notified when your rental application is approved</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="application-approved-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Application Declined</label>
                      <p class="text-xs text-gray-500">Get notified when your rental application is declined</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="application-declined-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <!-- Reviews & Verification -->
                <div class="space-y-3">
                  <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Reviews & Verification</h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Host Review Requests</label>
                      <p class="text-xs text-gray-500">Get notified when asked to submit a review for a host</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="host-review-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Renter Review Requests</label>
                      <p class="text-xs text-gray-500">Get notified when asked to submit a review for a renter</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="renter-review-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Landlord Info Requests</label>
                      <p class="text-xs text-gray-500">Get notified about previous landlord information requests</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="landlord-info-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Verification Completed</label>
                      <p class="text-xs text-gray-500">Get notified when your renter verification is completed</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="verification-completed-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <!-- Bookings & Stays -->
                <div class="space-y-3">
                  <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Bookings & Stays</h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Booking Completed</label>
                      <p class="text-xs text-gray-500">Get notified when a booking is completed</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="booking-completed-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Booking Canceled</label>
                      <p class="text-xs text-gray-500">Get notified when a booking is canceled</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="booking-canceled-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Move Out Upcoming</label>
                      <p class="text-xs text-gray-500">Get notified when your move out date is approaching</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="move-out-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Move In Upcoming</label>
                      <p class="text-xs text-gray-500">Get notified when your move in date is approaching</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="move-in-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <!-- Payments -->
                <div class="space-y-3">
                  <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">Payments</h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Payment Successful</label>
                      <p class="text-xs text-gray-500">Get notified when payments are processed successfully</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="payment-success-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Payment Failed</label>
                      <p class="text-xs text-gray-500">Get notified when payments fail to process</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="payment-failed-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <!-- External Communications -->
                <div class="space-y-3">
                  <h3 class="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">External Communications</h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-900">Off-Platform Host Communications</label>
                      <p class="text-xs text-gray-500">Get notified about communications with off-platform hosts</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" id="off-platform-toggle">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div id="error-state" class="text-center py-4 hidden">
                <p class="text-sm text-red-500">Failed to load notification preferences. Please try again.</p>
              </div>
            `;
            el.appendChild(content);

            // Load current preferences and set up event handlers
            try {
              const response = await fetch('/api/user/notification-preferences');
              const data = await response.json();
              
              if (data.success) {
                const prefs = data.preferences;
                
                // Set initial toggle states
                const toggles = [
                  { id: '#new-message-toggle', key: 'emailNewMessageNotifications' },
                  { id: '#new-conversation-toggle', key: 'emailNewConversationNotifications' },
                  { id: '#application-received-toggle', key: 'emailApplicationReceivedNotifications' },
                  { id: '#application-approved-toggle', key: 'emailApplicationApprovedNotifications' },
                  { id: '#application-declined-toggle', key: 'emailApplicationDeclinedNotifications' },
                  { id: '#host-review-toggle', key: 'emailSubmitHostReviewNotifications' },
                  { id: '#renter-review-toggle', key: 'emailSubmitRenterReviewNotifications' },
                  { id: '#landlord-info-toggle', key: 'emailLandlordInfoRequestNotifications' },
                  { id: '#verification-completed-toggle', key: 'emailVerificationCompletedNotifications' },
                  { id: '#booking-completed-toggle', key: 'emailBookingCompletedNotifications' },
                  { id: '#booking-canceled-toggle', key: 'emailBookingCanceledNotifications' },
                  { id: '#move-out-toggle', key: 'emailMoveOutUpcomingNotifications' },
                  { id: '#move-in-toggle', key: 'emailMoveInUpcomingNotifications' },
                  { id: '#payment-success-toggle', key: 'emailPaymentSuccessNotifications' },
                  { id: '#payment-failed-toggle', key: 'emailPaymentFailedNotifications' },
                  { id: '#off-platform-toggle', key: 'emailOffPlatformHostNotifications' }
                ];
                
                toggles.forEach(({ id, key }) => {
                  const toggle = content.querySelector(id) as HTMLInputElement;
                  if (toggle) {
                    toggle.checked = prefs[key] || false;
                  }
                });
                
                // Add event handlers
                const updatePreference = async (key: string, value: boolean) => {
                  try {
                    const updateResponse = await fetch('/api/user/notification-preferences', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ [key]: value })
                    });
                    
                    if (!updateResponse.ok) {
                      throw new Error('Failed to update preference');
                    }
                  } catch (error) {
                    console.error('Error updating notification preference:', error);
                    // Revert the toggle
                    (event.target as HTMLInputElement).checked = !value;
                  }
                };
                
                // Add event handlers for all toggles
                toggles.forEach(({ id, key }) => {
                  const toggle = content.querySelector(id) as HTMLInputElement;
                  if (toggle) {
                    toggle.addEventListener('change', (e) => {
                      updatePreference(key, (e.target as HTMLInputElement).checked);
                    });
                  }
                });
                
                // Show the settings and hide loading
                content.querySelector('#loading-state')?.classList.add('hidden');
                content.querySelector('#notification-settings')?.classList.remove('hidden');
              } else {
                // Show error state
                content.querySelector('#loading-state')?.classList.add('hidden');
                content.querySelector('#error-state')?.classList.remove('hidden');
              }
            } catch (error) {
              console.error('Error loading notification preferences:', error);
              // Show error state
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
          <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="p-0">
            <div className=" rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="px-4 py-3">
                  <h3 className="text-md font-medium">Notifications</h3>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto overflow-x-hidden ">
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
          <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="p-0">
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


                  return (
                    <React.Fragment key={item.id}>
                      {sectionChanged && lastSection > 1 && <div className="border-t border-gray-200" />}
                      {href && isItemEnabled ? (
                        <Link 
                          href={href} 
                          className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {label}
                        </Link>
                      ) : (
                        <button
                          onClick={item.onClick ? item.onClick : () => setIsMenuOpen(false)}
                          className={`w-full px-4 py-3 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset ${
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
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset"
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
          <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="p-0">
            <div className=" rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col">
                <Link href="/sign-in" className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset">
                  Sign In
                </Link>
                <button onClick={() => setIsSupportOpen(true)} className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset">
                  Get help
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <SupportDialog open={isSupportOpen} onOpenChange={setIsSupportOpen} />
    </div>
  )
}

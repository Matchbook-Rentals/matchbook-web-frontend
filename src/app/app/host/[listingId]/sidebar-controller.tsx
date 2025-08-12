"use client"

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

export function SidebarController() {
  const pathname = usePathname();
  const { setOpen, open, isMobile } = useSidebar();
  const previousPathnameRef = useRef<string>();

  useEffect(() => {
    // Only close sidebar on route change, not on every render
    // And only on desktop (medium+ screens), not mobile
    const isLeaseCreateRoute = pathname.includes('/leases/create');
    const routeChanged = previousPathnameRef.current !== pathname;
    
    if (isLeaseCreateRoute && routeChanged && open && !isMobile) {
      setOpen(false);
    }
    
    previousPathnameRef.current = pathname;
  }, [pathname, setOpen, open, isMobile]);

  return null;
}
"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { PieChart, Home, Users, Calendar, MessageSquare, CreditCard, Settings } from "lucide-react"

interface BreadcrumbItem {
  title: string;
  icon: string;
}

interface SidebarMenuItem {
  title: string;
  url: string;
  icon: string;
}

interface SidebarGroup {
  title?: string;
  items: SidebarMenuItem[];
}

interface HostBreadcrumbProps {
  groups: SidebarGroup[];
  breadcrumbTitle?: string;
}

export function HostBreadcrumb({ groups, breadcrumbTitle }: HostBreadcrumbProps) {
  const pathname = usePathname()

  const getIconComponent = (iconName: string) => {
    const icons = {
      PieChart,
      Home,
      Users,
      Calendar,
      MessageSquare,
      CreditCard,
      Settings
    };
    return icons[iconName as keyof typeof icons] || PieChart;
  };

  const getCurrentBreadcrumb = (): BreadcrumbItem => {
    // If breadcrumbTitle is provided, use it with a default icon
    if (breadcrumbTitle) {
      return {
        title: breadcrumbTitle,
        icon: "PieChart"
      };
    }

    const allItems = groups.flatMap(group => group.items);
    
    // Find exact match first
    let currentItem = allItems.find(item => pathname === item.url);
    
    // If no exact match, find partial match
    if (!currentItem) {
      currentItem = allItems.find(item => {
        return pathname.startsWith(item.url) && pathname !== item.url;
      });
    }

    if (currentItem) {
      return {
        title: currentItem.title,
        icon: currentItem.icon
      };
    }

    // Default fallback
    const firstItem = allItems[0];
    return firstItem ? {
      title: firstItem.title,
      icon: firstItem.icon
    } : {
      title: "Dashboard",
      icon: "PieChart"
    };
  };

  const breadcrumb = getCurrentBreadcrumb();
  const BreadcrumbIcon = getIconComponent(breadcrumb.icon);

  return (
    <div className="flex items-center gap-2">
      <BreadcrumbIcon className="h-4 w-4" />
      <span className="font-medium">{breadcrumb.title}</span>
    </div>
  );
}
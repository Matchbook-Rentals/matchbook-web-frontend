"use client"

import * as React from "react"
import { LucideIcon, BarChart3, Home, Users, Calendar, MessageSquare, CreditCard, Settings, Loader2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface SidebarMenuItem {
  title: string;
  url: string;
  icon: string;
  isActive?: boolean;
}

interface SidebarGroup {
  title?: string;
  items: SidebarMenuItem[];
}

interface BreadcrumbItem {
  title: string;
  icon: string;
}

interface HostSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groups: SidebarGroup[];
  breadcrumb?: BreadcrumbItem;
}

export function HostSidebar({ groups, breadcrumb, ...props }: HostSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null)

  const getIconComponent = (iconName: string) => {
    const icons = {
      BarChart3,
      Home,
      Users,
      Calendar,
      MessageSquare,
      CreditCard,
      Settings
    };
    return icons[iconName as keyof typeof icons] || BarChart3;
  };

  const handleNavigation = (url: string) => {
    if (pathname === url) return; // Don't navigate if already on the page
    setNavigatingTo(url)
    router.push(url)
  }

  // Reset navigation state when pathname changes
  React.useEffect(() => {
    setNavigatingTo(null)
  }, [pathname])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/app/host">
                  <img
                    className="p-2"
                    alt="Logo"
                    src="/new-green-logo.png"
                  />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                const isNavigating = navigatingTo === item.url;
                const isDisabled = navigatingTo !== null && !isNavigating;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => handleNavigation(item.url)}
                      isActive={item.isActive}
                      disabled={isDisabled}
                      className={`font-medium ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isNavigating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconComponent className="h-4 w-4" />
                      )}
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail>
      </SidebarRail>
    </Sidebar>
  )
}

"use client"

import * as React from "react"
import { LucideIcon, PieChart, Home, Users, Calendar, MessageSquare, CreditCard, Settings, Loader2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

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


interface HostSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groups: SidebarGroup[];
}

export function HostSidebar({ groups, ...props }: HostSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null)

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

  // Calculate active states dynamically based on current pathname
  const getGroupsWithActiveStates = () => {
    return groups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        isActive: pathname === item.url || pathname.startsWith(item.url + '/')
      }))
    }));
  };

  const groupsWithActiveStates = getGroupsWithActiveStates();

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
              <Link href="/app/host">
                  <img
                    className="p-2"
                    alt="Logo"
                    src="/new-green-logo.png"
                  />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groupsWithActiveStates.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex} className="border-t pt-4">
            {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                const isNavigating = navigatingTo === item.url;
                const isDisabled = navigatingTo !== null && !isNavigating;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={item.isActive}
                      disabled={isDisabled}
                      className={`font-medium ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Link 
                        href={item.url}
                        onClick={(e) => {
                          if (isDisabled) {
                            e.preventDefault();
                            return;
                          }
                          handleNavigation(item.url);
                        }}
                      >
                        {isNavigating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconComponent className="h-4 w-4" />
                        )}
                        {item.title}
                      </Link>
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

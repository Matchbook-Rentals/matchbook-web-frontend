'use client'
import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from "framer-motion"

interface Tab {
  value: string;
  label: string;
  Icon?: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
  iconClassName?: string;
}

interface MobileTabSelectorProps {
  tabs: Tab[];
  className?: string;
  tabsClassName?: string;
  tabsListClassName?: string;
  useUrlParams?: boolean;
  defaultTab?: string; // Kept for backward compatibility if activeTabValue is not provided
  activeTabValue?: string; // New prop for controlled state
  onTabChange?: (value: string) => void; // Renamed from onTabClick
}

export default function MobileTabSelector({
  tabs,
  className,
  tabsListClassName,
  tabsClassName,
  useUrlParams = false,
  defaultTab,
  activeTabValue, // Destructure new prop
  onTabChange, // Destructure renamed prop
}: MobileTabSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Internal state is only used if activeTabValue is not provided
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.value)

  // Determine the effective active tab: controlled or internal
  const currentActiveTab = activeTabValue !== undefined ? activeTabValue : internalActiveTab;

  // Effect to sync internal state if defaultTab changes and it's not controlled
  useEffect(() => {
    if (activeTabValue === undefined && defaultTab) {
      setInternalActiveTab(defaultTab);
    }
  }, [defaultTab, activeTabValue]);


  // Effect for URL param handling (reads from URL)
  useEffect(() => {
    // This effect should probably only run if the component is NOT controlled externally
    // or if it needs to initialize based on URL regardless. Let's keep it for now.
    if (useUrlParams && activeTabValue === undefined) { // Only read from URL if not controlled
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl && tabs.some(tab => tab.value === tabFromUrl)) {
        // Only set internal state if not controlled
        setInternalActiveTab(tabFromUrl);
      }
    }
    // Ensure dependency array includes activeTabValue to re-evaluate if control changes
  }, [useUrlParams, searchParams, tabs, activeTabValue]);

  // Effect for URL param handling (writes to URL)
  useEffect(() => {
    // This effect should run based on the currentActiveTab (controlled or internal)
    if (useUrlParams && currentActiveTab) {
      const currentUrlTab = searchParams.get('tab');
      if (currentUrlTab !== currentActiveTab) {
        // Use setTimeout to defer URL update
        setTimeout(() => {
          router.replace(`?tab=${currentActiveTab}`, { scroll: false });
        }, 0);
      }
    }
    // Ensure dependency array includes currentActiveTab
  }, [currentActiveTab, useUrlParams, router, searchParams]);


  const handleTabChange = (value: string) => {
    // Reset scroll position to top when switching tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Call the external callback if provided
    if (onTabChange) {
      onTabChange(value);
    }

    // Only update internal state if the component is not controlled
    if (activeTabValue === undefined) {
      setInternalActiveTab(value);
    }

    // URL update logic is now handled by the useEffect hook based on currentActiveTab
  };


  return (
    <Tabs
      className={cn("w-full relative", className)}
      value={currentActiveTab} // Use the determined active tab
      onValueChange={handleTabChange} // This triggers our handler
    >
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          className={tabsClassName}
          value={tab.value}
        >
          {tab.content}
        </TabsContent>
      ))}

      <TabsList
        className={cn(
          "fixed bottom-0 left-0 right-0 flex w-full overflow-x-scroll justify-between pt-0  items-center h-[68px] bg-background border-gray-200 px-2 z-50",
          tabsListClassName
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "flex flex-col items-center  w-full h-full relative",
              "data-[state=active]:bg-transparent data-[state=active]:text-[#404040]",
              tab.className
            )}
          >
            {tab.Icon && (
              <div className={cn(
                "h-full w-full",
                "text-gray-500",
                "data-[state=active]:text-primary",
                "flex justify-center",
                tab.iconClassName
              )}>
                {tab.Icon}
              </div>
            )}

            <div className="flex flex-col items-center pb-1 justify-center gap-0 space-0">
              <span className={cn(
                "text-xs text-gray-500 font-normal",
                tab.value === currentActiveTab ? "text-[#404040] font-medium" // Use currentActiveTab for styling
                  : "", tab.textSize)} style={{ lineHeight: '1' }}>
                {tab.label}
                {tab.value === currentActiveTab && ( // Use currentActiveTab for animation condition
                  <motion.div
                    className=" h-[2px] bg-primary"
                    layoutId="activeTabMobile" // Ensure unique layoutId if used elsewhere
                    transition={{
                      duration: 0.4,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

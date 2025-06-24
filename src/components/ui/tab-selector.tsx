'use client'
import { useState, useEffect, useRef } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from 'next/navigation'

interface Tab {
  value: string;
  label: string;
  Icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
}

interface TabSelectorProps {
  tabs: Tab[];
  className?: string;
  tabsClassName?: string;
  tabsListClassName?: string;
  useUrlParams?: boolean;
  defaultTab?: string;
  secondaryButton?: React.ReactNode;
  useIcons?: boolean;
  activeTabValue?: string; // New prop for controlled state
  onTabChange?: (value: string) => void; // Renamed from onTabClick
  selectedTabColor?: string; // Color for selected tab
}

export default function TabSelector({
  tabs,
  className,
  tabsListClassName,
  tabsClassName,
  useUrlParams = false,
  defaultTab,
  secondaryButton,
  useIcons = false,
  activeTabValue, // Destructure new prop
  onTabChange, // Destructure renamed prop
  selectedTabColor = '#3396FF', // Default to current blue color
}: TabSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Internal state is only used if activeTabValue is not provided
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.value)
  const tabsListRef = useRef<HTMLDivElement>(null)

  // Determine the effective active tab: controlled or internal
  const currentActiveTab = activeTabValue !== undefined ? activeTabValue : internalActiveTab;

  // Effect to sync internal state if defaultTab changes and it's not controlled
  useEffect(() => {
    if (activeTabValue === undefined && defaultTab) {
      setInternalActiveTab(defaultTab);
    }
  }, [defaultTab, activeTabValue]);

  // Effect for URL param handling (reads from URL and writes if needed)
  useEffect(() => {
    // This effect should probably only run if the component is NOT controlled externally
    // or if it needs to initialize based on URL regardless.
    if (useUrlParams) {
      const tabFromUrl = searchParams.get('tab');
      if (activeTabValue === undefined) { // Only read from URL if not controlled
        if (tabFromUrl && tabs.some(tab => tab.value === tabFromUrl)) {
          setInternalActiveTab(tabFromUrl);
        } else if (internalActiveTab && tabFromUrl !== internalActiveTab) {
          // If not controlled and URL doesn't match internal, update URL
          router.replace(`?tab=${internalActiveTab}`, { scroll: false });
        }
      } else { // If controlled, ensure URL matches the controlled value
        if (tabFromUrl !== activeTabValue) {
          router.replace(`?tab=${activeTabValue}`, { scroll: false });
        }
      }
    }
    // Ensure dependency array includes relevant state/props
  }, [useUrlParams, searchParams, tabs, router, activeTabValue, internalActiveTab]);


  // Effect for scrolling the active tab into view
  useEffect(() => {
    if (tabsListRef.current) {
      const tabsList = tabsListRef.current
      const activeTabElement = tabsList.querySelector(`[data-state="active"]`)

      if (activeTabElement) {
        const tabsListRect = tabsList.getBoundingClientRect()
        const activeTabRect = activeTabElement.getBoundingClientRect()

        const scrollLeft = (activeTabRect.left + activeTabRect.width / 2) -
          (tabsListRect.left + tabsListRect.width / 2)

        tabsList.scrollTo({
          left: tabsList.scrollLeft + scrollLeft,
          behavior: 'smooth'
        })
      }
    }
    // Depend on the actual active tab value being used
  }, [currentActiveTab]);

  const handleTabChange = (value: string) => {
    // Call the external callback if provided
    if (onTabChange) {
      onTabChange(value);
    }

    // Only update internal state if the component is not controlled
    if (activeTabValue === undefined) {
      setInternalActiveTab(value);
    }

    // URL update logic is now handled by the useEffect hook
  };

  return (
    <div className={cn("flex justify-start space-x-2 py-4 border-b", className)}>
      <Tabs
        className="w-full"
        value={currentActiveTab} // Use the determined active tab
        onValueChange={handleTabChange} // This triggers our handler
      >
        <div className="flex items-start p-0 justify-between space-x-4 border-gray-300">
          <TabsList
            ref={tabsListRef}
            className={cn(
              "flex justify-start pt-6 pb-8 px-2 space-x-2 overflow-x-auto overflow-y-hidden scrollbar-none",
              tabsListClassName
            )}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn("flex flex-col items-center transition-none", tab.className)}
                style={{ 
                  '--selected-color': selectedTabColor,
                  color: currentActiveTab === tab.value ? selectedTabColor : undefined 
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  if (currentActiveTab !== tab.value) {
                    e.currentTarget.style.color = selectedTabColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentActiveTab !== tab.value) {
                    e.currentTarget.style.color = '';
                  }
                }}
              >
                {useIcons && tab.Icon && (
                  <div className={cn("flex items-center justify-center h-8 w-8")}>
                    <tab.Icon className="h-2 w-2 text-sm" />
                  </div>
                )}
                <div className="flex flex-col">
                  {/* Use currentActiveTab for styling */}
                  <span 
                    className={cn("text-sm mb-2", tab.textSize)}
                    style={{
                      color: currentActiveTab === tab.value ? selectedTabColor : undefined
                    }}
                  >
                    {tab.label}
                  </span>
                  {/* Use currentActiveTab for animation condition */}
                  {currentActiveTab === tab.value && (
                    <motion.div 
                      className="h-[1px] w-full rounded-full" 
                      style={{ backgroundColor: selectedTabColor }}
                      layout 
                      layoutId="underline"
                    />
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          {secondaryButton}
        </div>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} className={tabsClassName} value={tab.value} forceMount={tab.forceMount || undefined}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

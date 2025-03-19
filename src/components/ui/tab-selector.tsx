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
}: TabSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value)
  const tabsListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (useUrlParams) {
      const tabFromUrl = searchParams.get('tab')
      if (tabFromUrl && tabs.some(tab => tab.value === tabFromUrl)) {
        setActiveTab(tabFromUrl)
      } else if (activeTab) {
        router.replace(`?tab=${activeTab}`, { scroll: false })
      }
    }
  }, [useUrlParams, searchParams, tabs, router])

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
  }, [activeTab])

  const handleTabChange = (value: string) => {
    if (useUrlParams) {
      router.replace(`?tab=${value}`, { scroll: false })
    }
    setActiveTab(value)
  }

  return (
    <div className={cn("flex justify-start space-x-2 py-4 border-b", className)}>
      <Tabs
        className="w-full"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="flex items-start p-0 justify-between space-x-4 border-gray-300">
          <TabsList
            ref={tabsListRef}
            className={cn(
              "flex : justify-start pt-6 pb-8 space-x-2 overflow-x-auto overflow-y-hidden scrollbar-none",
              tabsListClassName
            )}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn("flex flex-col items-center hover:bg-gray-300", tab.className)}
              >
                {useIcons && tab.Icon && (
                  <div className={cn("flex items-center justify-center h-8 w-8")}>
                    <tab.Icon className="h-2 w-2 text-sm" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className={cn("text-sm", tab.textSize, activeTab === tab.value ? "text-[#3396FF]" : "")}>{tab.label}</span>
                  {activeTab === tab.value && <motion.div className="h-[1px] w-full bg-[#3396FF] rounded-full" layout layoutId="underline"></motion.div>}
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

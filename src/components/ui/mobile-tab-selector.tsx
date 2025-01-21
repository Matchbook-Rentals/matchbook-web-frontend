'use client'
import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from "framer-motion"

interface Tab {
  value: string;
  label: string;
  Icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
}

interface MobileTabSelectorProps {
  tabs: Tab[];
  className?: string;
  tabsClassName?: string;
  tabsListClassName?: string;
  useUrlParams?: boolean;
  defaultTab?: string;
}

export default function MobileTabSelector({
  tabs,
  className,
  tabsListClassName,
  tabsClassName,
  useUrlParams = false,
  defaultTab,
}: MobileTabSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value)

  useEffect(() => {
    if (useUrlParams) {
      const tabFromUrl = searchParams.get('tab')
      if (tabFromUrl && tabs.some(tab => tab.value === tabFromUrl)) {
        setActiveTab(tabFromUrl)
      } else if (activeTab) {
        router.replace(`?tab=${activeTab}`, { scroll: false })
      }
    }
  }, [useUrlParams, searchParams, tabs, router, activeTab])

  const handleTabChange = (value: string) => {
    if (useUrlParams) {
      router.replace(`?tab=${value}`, { scroll: false })
    }
    setActiveTab(value)
  }

  return (
    <Tabs
      className={cn("w-full relative", className)}
      value={activeTab}
      onValueChange={handleTabChange}
    >
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          className={tabsClassName + 'pb-16'}
          value={tab.value}
        >
          {tab.content}
        </TabsContent>
      ))}

      <TabsList
        className={cn(
          "fixed bottom-0 left-0 right-0 flex justify-between pt-1  items-center h-[70px] bg-background border-t border-gray-200 px-2 z-50",
          tabsListClassName
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "flex flex-col items-center justify-end w-full h-full relative",
              "data-[state=active]:bg-transparent data-[state=active]:text-[#404040]",
              tab.className
            )}
          >
            {tab.Icon && (
              <tab.Icon className={cn(
                "h-[64px] w-[64px]",
                "text-gray-500",
                "data-[state=active]:text-primary"
              )} />
            )}

            <div className="flex flex-col items-center pb-1 justify-center gap-0 space-0">
              <span className={cn(
                "text-xs text-gray-500 font-normal",
                 tab.value === activeTab ? "text-[#404040] font-medium"
                 : "", tab.textSize)} style={{lineHeight: '1'}}>
                {tab.label}
              {tab.value === activeTab && (
                <motion.div
                  className=" h-[2px] bg-primary"
                  layoutId="activeTab"
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

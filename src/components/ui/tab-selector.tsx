'use client'
import { useState, useEffect } from "react"
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
}

interface TabSelectorProps {
  tabs: Tab[];
  className?: string;
  tabsClassName?: string;
  tabsListClassName?: string;
  useUrlParams?: boolean;
  defaultTab?: string;
}

export default function TabSelector({ 
  tabs, 
  className, 
  tabsListClassName, 
  tabsClassName, 
  useUrlParams = false,
  defaultTab
}: TabSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value)

  useEffect(() => {
    if (useUrlParams) {
      const tabFromUrl = searchParams.get('tab')
      if (tabFromUrl && tabs.some(tab => tab.value === tabFromUrl)) {
        setActiveTab(tabFromUrl)
      } else if (activeTab) {
        router.push(`?tab=${activeTab}`, { scroll: false })
      }
    }
  }, [useUrlParams, searchParams, tabs, router])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (useUrlParams) {
      router.push(`?tab=${value}`, { scroll: false })
    }
  }

  return (
    <div className={cn("flex justify-start space-x-2 py-4 border-b", className)}>
      <Tabs 
        className={cn("w-full", tabsClassName)} 
        value={activeTab} 
        onValueChange={handleTabChange}
      >
        <TabsList className={cn("flex justify-start mb-4 pt-6 pb-8 border-b-2 border-gray-300 space-x-2", tabsListClassName)}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn("flex flex-col items-center hover:bg-gray-300", tab.className)}
            >
              <div className={cn("flex items-center justify-center", tab.Icon ? 'h-8 w-8' : '')}>
                {tab.Icon && <tab.Icon className="h-2 w-2 text-sm" />}
              </div>
              <div className="flex flex-col">
                <span className={cn("text-sm",tab.textSize )}>{tab.label}</span>
                {activeTab === tab.value && <motion.div className="h-[2px] w-full bg-black rounded-full" layout layoutId="underline"></motion.div>}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

'use client'
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
}

export default function TabSelector({ tabs, className, tabsListClassName, tabsClassName }: TabSelectorProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.value);

  return (
    <div className={cn("flex justify-start space-x-2 py-4 border-b", className)}>
      <Tabs className={cn("w-full", tabsClassName)} defaultValue={tabs[0]?.value}>
        <TabsList className={cn("flex justify-start mb-4 pt-6 pb-8 border-b-2 border-gray-300 space-x-2", tabsListClassName)}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn("flex flex-col items-center hover:bg-gray-300", tab.className)}
              onClick={() => setActiveTab(tab.value)}
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

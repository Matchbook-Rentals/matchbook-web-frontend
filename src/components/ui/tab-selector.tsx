'use client'
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { motion } from "framer-motion";

interface Tab {
  value: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface TabSelectorProps {
  tabs: Tab[];
}

export default function TabSelector({ tabs }: TabSelectorProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.value);

  return (
    <div className="flex border-2 border-red-500 justify-start space-x-2 py-4 border-b">
      <Tabs defaultValue={tabs[0]?.value}>
        <TabsList className="flex mb-4 pt-6 pb-8 border-b-2 border-gray-300 space-x-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col items-center hover:bg-gray-300" onClick={() => setActiveTab(tab.value)}>
              <div className="h-8 w-8 flex items-center justify-center">
                <tab.icon className="h-2 w-2 text-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm">{tab.label}</span>
                {activeTab === tab.value && <motion.div className="h-1 w-full bg-black rounded-full" layout layoutId="underline"></motion.div>}
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

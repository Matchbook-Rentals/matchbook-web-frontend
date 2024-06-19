'use client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

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
  return (
    <div className="flex border-2 border-red-500 justify-start space-x-2 py-4 border-b">
      <Tabs defaultValue={tabs[0]?.value}>
        <TabsList className="flex mb-4 py-6 bg-primaryBrand border-b-2 border-gray-300 space-x-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col items-center hover:bg-gray-300">
              <div className="h-8 w-8 flex items-center justify-center">
                <tab.icon className="h-2 w-2 text-sm" />
              </div>
              <span className="text-sm">{tab.label}</span>
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

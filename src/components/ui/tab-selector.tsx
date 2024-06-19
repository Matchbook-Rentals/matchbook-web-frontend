import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface TabSelectorProps {
  tabs: string[];
}

export default function TabSelector({ tabs }: TabSelectorProps) {
  return (
    <div className="flex border-2 border-red-500 justify-center space-x-8 py-4 border-b">
      <Tabs defaultValue="overview">
        <TabsList className="flex space-x-8">
          <TabsTrigger value="overview" className="flex flex-col items-center">
            <SearchIcon className="h-8 w-8" />
            <span className="mt-2">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="listing" className="flex flex-col items-center">
            <ListIcon className="h-8 w-8" />
            <span className="mt-2">Listing</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex flex-col items-center">
            <UserPlusIcon className="h-8 w-8" />
            <span className="mt-2">Applications</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex flex-col items-center">
            <DollarSignIcon className="h-8 w-8" />
            <span className="mt-2">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col items-center">
            <InfoIcon className="h-8 w-8" />
            <span className="mt-2">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex flex-col items-center">
            <CalendarIcon className="h-8 w-8" />
            <span className="mt-2">Calendar</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div>Overview content goes here.</div>
        </TabsContent>
        <TabsContent value="listing">
          <div>Listing content goes here.</div>
        </TabsContent>
        <TabsContent value="applications">
          <div>Applications content goes here.</div>
        </TabsContent>
        <TabsContent value="payments">
          <div>Payments content goes here.</div>
        </TabsContent>
        <TabsContent value="analytics">
          <div>Analytics content goes here.</div>
        </TabsContent>
        <TabsContent value="calendar">
          <div>Calendar content goes here.</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CalendarIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}


function DollarSignIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}


function InfoIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}


function ListIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  )
}


function SearchIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}


function UserPlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  )
}
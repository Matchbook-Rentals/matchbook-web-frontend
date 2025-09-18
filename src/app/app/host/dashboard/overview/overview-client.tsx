"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon, MoreVerticalIcon, ClipboardList, Calendar, Star, Home, Loader2, CreditCard, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { StatisticsCard } from "./statistics-card";
import { OnboardingChecklistCard, HostUserData, isHostOnboardingComplete } from "../../components/onboarding-checklist-card";

// Icon mapping for serializable icon names
const iconMap = {
  ClipboardList,
  Calendar,
  Star,
  Home,
  Database,
};


const OverviewSection = ({ userFirstName }: { userFirstName: string | null }): JSX.Element => {
  const displayName = userFirstName || 'host';
  
  return (
    <section className="w-full">
      <div className="flex flex-col gap-2">
        <h2 className="font-medium text-2xl text-gray-900 leading-[28.8px] font-['Poppins',Helvetica]">
          Overview
        </h2>
        <p className="text-lg text-gray-600 font-normal leading-[27px] font-['Poppins',Helvetica]">
          Hello {displayName}, here&apos;s what&apos;s happening with your properties
        </p>
      </div>
    </section>
  );
};

const StatisticsSection = ({ 
  cards, 
  showMockData, 
  onToggleMockData 
}: { 
  cards: StatisticsCardData[];
  showMockData: boolean;
  onToggleMockData: () => void;
}): JSX.Element => {

  const renderCard = (card: StatisticsCardData, index: number) => {
    const IconComponent = iconMap[card.iconName as keyof typeof iconMap];
    
    // Render footer based on type
    let footerElement = null;
    if (card.footer?.type === "badges") {
      // Filter badges for small and large screens
      const allBadges = card.footer.badges.filter(badge => badge);
      const smallScreenBadges = allBadges.filter(badge => 
        badge.text.toLowerCase().includes('pending') || badge.text.toLowerCase().includes('upcoming')
      );
      
      footerElement = (
        <>
          {/* Small screen layout - only show pending/upcoming badges */}
          <div className="flex sm:hidden flex-wrap items-center gap-2 justify-start">
            {smallScreenBadges.map((badge, badgeIndex) => (
              <div
                key={`small-${badgeIndex}`}
                className={`px-2 py-1 ${badge.bg} rounded-full font-normal text-xs whitespace-nowrap`}
              >
                <span className={`${badge.valueColor} leading-[0.1px]`}>
                  {badge.text.split(" ")[0]}{" "}
                </span>
                <span className={`${badge.labelColor} leading-[18px]`}>
                  {badge.text.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
          
          {/* Large screen layout - show all badges */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 justify-start">
            {allBadges.map((badge, badgeIndex) => (
              <div
                key={`large-${badgeIndex}`}
                className={`px-2 py-1 ${badge.bg} rounded-full font-normal text-xs whitespace-nowrap`}
              >
                <span className={`${badge.valueColor} leading-[0.1px]`}>
                  {badge.text.split(" ")[0]}{" "}
                </span>
                <span className={`${badge.labelColor} leading-[18px]`}>
                  {badge.text.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
        </>
      );
    }
    
    // Handle toggle card click
    const handleCardClick = card.id === "mock-toggle" ? onToggleMockData : undefined;
    
    return (
      <StatisticsCard
        key={index}
        id={card.id}
        title={card.title}
        value={card.value}
        icon={IconComponent}
        iconBg={card.iconBg}
        iconColor={card.iconColor}
        link={card.link}
        asLink={card.asLink}
        badges={card.badges}
        subtitle={card.subtitle}
        footer={footerElement}
        onClick={handleCardClick}
        className="h-full"
      />
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 grid-cols-2 gap-x-1 gap-y-4 sm:gap-6 lg:flex lg:justify-between">
        {cards.map((card, index) => (
          <div key={index} className="min-w-0 lg:flex-1">
            {renderCard(card, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

const ApplicationsSection = ({ 
  showMockData, 
  mockChartData,
  realChartData
}: { 
  showMockData: boolean; 
  mockChartData: MockChartData;
  realChartData: MockChartData;
}): JSX.Element => {
  const applicationsData = showMockData ? mockChartData.applicationsData : realChartData.applicationsData;
  const revenueData = showMockData ? mockChartData.revenueData : realChartData.revenueData;

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full h-full">
      <Card className="flex-1 border border-gray-200 rounded-[20px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-[18px] border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="font-bold text-lg text-gray-900 font-['Poppins',Helvetica] leading-[27px]">
              Applications
            </CardTitle>
            <CardDescription className="font-medium text-sm text-gray-500 font-['Poppins',Helvetica] leading-[21px]">
              Track your property applications over time
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6 p-0">
                <MoreVerticalIcon className="w-[18px] h-[18px]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1">
              <Link 
                href="/app/host/dashboard/applications"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                View Applications
              </Link>
            </PopoverContent>
          </Popover>
        </CardHeader>

        <CardContent className="p-6 flex flex-col gap-4 flex-1">
          {applicationsData ? (
            <>
              <div className="flex gap-8 items-center">
                <div className="inline-flex gap-1.5 items-center">
                  <div className="w-3 h-3 rounded-md bg-[#1fb356]" />
                  <span className="font-normal text-sm text-gray-500 font-['Poppins',Helvetica] leading-[21px]">
                    Approved
                  </span>
                </div>
                <div className="inline-flex gap-1.5 items-center">
                  <div className="w-3 h-3 rounded-md bg-[#edbd33]" />
                  <span className="font-normal text-sm text-gray-500 font-['Poppins',Helvetica] leading-[21px]">
                    Pending
                  </span>
                </div>
                <div className="inline-flex gap-1.5 items-center">
                  <div className="w-3 h-3 rounded-md bg-[#e62e2e]" />
                  <span className="font-normal text-sm text-gray-500 font-['Poppins',Helvetica] leading-[21px]">
                    Declined
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={applicationsData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    maxBarSize={12}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(label) => {
                        const monthMap: { [key: string]: string } = {
                          'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
                          'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
                          'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
                        };
                        return monthMap[label] || label;
                      }}
                      formatter={(value, name) => {
                        if (name === 'spacer1' || name === 'spacer2') return [null, null];
                        return [value, name.charAt(0).toUpperCase() + name.slice(1)];
                      }}
                    />
                    <Bar dataKey="approved" stackId="a" fill="#1fb356" radius={[6, 6, 6, 6]} />
                    <Bar dataKey="spacer1" stackId="a" fill="transparent" />
                    <Bar dataKey="pending" stackId="a" fill="#edbd33" radius={[6, 6, 6, 6]} />
                    <Bar dataKey="spacer2" stackId="a" fill="transparent" />
                    <Bar dataKey="declined" stackId="a" fill="#e62e2e" radius={[6, 6, 6, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-[240px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-lg font-medium mb-2">No data available</div>
                <div className="text-gray-500 text-sm">No data for applications visualization</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 border border-gray-200 rounded-xl shadow-sm flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-[18px] border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="font-bold text-lg text-gray-900 font-['Poppins',Helvetica] leading-[27px]">
              Monthly Revenue
            </CardTitle>
            <CardDescription className="font-medium text-sm text-gray-500 font-['Poppins',Helvetica] leading-[21px]">
              Amount of rent received each month
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6 p-0">
                <MoreVerticalIcon className="w-[18px] h-[18px]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1">
              <Link 
                href="/app/host/dashboard/bookings"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                View Bookings
              </Link>
              <Link 
                href="/app/host/dashboard/payments"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                View Payments
              </Link>
            </PopoverContent>
          </Popover>
        </CardHeader>

        <CardContent className="p-6 flex flex-col gap-4 flex-1">
          {revenueData ? (
            <div className="flex-1 min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B6E6E" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0B6E6E" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(label) => {
                      const monthMap: { [key: string]: string } = {
                        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
                        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
                        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
                      };
                      return monthMap[label] || label;
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0B6E6E" 
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 6, fill: '#0B6E6E' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 min-h-[240px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-lg font-medium mb-2">No data available</div>
                <div className="text-gray-500 text-sm">No data for revenue visualization</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface StatisticsCardData {
  id: string;
  title: string;
  value: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  link?: string;
  asLink?: boolean;
  badges?: Array<{
    text: string;
    bg: string;
    valueColor: string;
    labelColor: string;
  }>;
  subtitle?: {
    value?: string;
    name?: string;
    text?: string;
    valueColor?: string;
  };
  footer?: {
    type: "badges";
    badges: Array<{
      text: string;
      bg: string;
      valueColor: string;
      labelColor: string;
    } | null>; // Allow null for empty badge slots
  };
}

interface MockChartData {
  applicationsData: Array<{
    month: string;
    approved: number;
    spacer1: number;
    pending: number;
    spacer2: number;
    declined: number;
  }>;
  revenueData: Array<{
    month: string;
    revenue: number;
  }>;
}

interface OverviewClientProps {
  cards: StatisticsCardData[];
  mockCards: StatisticsCardData[];
  mockChartData: MockChartData;
  realChartData: MockChartData;
  userFirstName: string | null;
  hostUserData: HostUserData | null;
  isAdminDev: boolean;
}

export default function OverviewClient({ cards, mockCards, mockChartData, realChartData, userFirstName, hostUserData, isAdminDev }: OverviewClientProps) {
  const [showMockData, setShowMockData] = useState(false);
  
  // Check if onboarding is complete
  const onboardingComplete = isHostOnboardingComplete(hostUserData);
  
  // Show onboarding checklist if:
  // 1. User is admin_dev (always show for testing), OR
  // 2. Onboarding is not complete
  const shouldShowOnboardingChecklist = isAdminDev || !onboardingComplete;
  
  const displayCards = showMockData ? mockCards : cards;
  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 h-full min-h-screen">
      <OverviewSection userFirstName={userFirstName} />
      {shouldShowOnboardingChecklist && (
        <OnboardingChecklistCard hostUserData={hostUserData} isAdminDev={isAdminDev} />
      )}
      <StatisticsSection 
        cards={displayCards} 
        showMockData={showMockData}
        onToggleMockData={() => setShowMockData(!showMockData)}
      />
      <div className="flex-1">
        <ApplicationsSection showMockData={showMockData} mockChartData={mockChartData} realChartData={realChartData} />
      </div>
    </div>
  );
}

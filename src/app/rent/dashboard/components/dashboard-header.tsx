'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  isAdmin: boolean;
  currentMode?: string;
}

export const DashboardHeader = ({ 
  isAdmin, 
  currentMode 
}: DashboardHeaderProps) => (
  <div className="mb-8 flex items-center justify-between">
    <h1 className="text-2xl font-semibold text-[#404040]">Renter Dashboard</h1>
    {isAdmin && (
      <div className="flex gap-2">
        <Button 
          variant={currentMode === 'demo' ? 'default' : 'outline'} 
          size="sm"
          asChild
        >
          <Link href="/rent/dashboard?mode=demo">See Demo</Link>
        </Button>
        <Button 
          variant={currentMode === 'empty' ? 'default' : 'secondary'} 
          size="sm"
          asChild
        >
          <Link href="/rent/dashboard?mode=empty">See Empty</Link>
        </Button>
        {currentMode && (
          <Button 
            variant="ghost" 
            size="sm"
            asChild
          >
            <Link href="/rent/dashboard">Reset</Link>
          </Button>
        )}
      </div>
    )}
  </div>
);

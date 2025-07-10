'use client';

import React from 'react';
import { ConnectPayments } from '@stripe/react-connect-js';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {  DollarSign, TrendingUp, Users } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

// Mock data for dashboard widgets - replace with real data
const mockStats = {
  totalRevenue: '$12,486',
  monthlyGrowth: '+12.5%',
  totalCustomers: 156,
  pendingPayments: 8,
};

export default function PaymentsPage() {
  const { user } = useUser();
  const [accountReady, setAccountReady] = React.useState(false);

  // Mock loading state based on user setup
  React.useEffect(() => {
    if (user) {
      // Simulate checking if user has completed onboarding
      const timer = setTimeout(() => setAccountReady(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
      </div>

      {/* Dashboard Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.monthlyGrowth} from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Total tenants this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.monthlyGrowth}</div>
            <p className="text-xs text-muted-foreground">
              Monthly growth rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Component */}
      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          <EmbeddedComponentContainer 
            componentName="ConnectPayments"
            onAccountCreated={() => setAccountReady(true)}
          >
            {!accountReady ? (
              <div className="flex items-center justify-center gap-1 py-16 text-center">
                <span className="text-lg font-medium">Loading payment data...</span>
              </div>
            ) : (
              <ConnectPayments />
            )}
          </EmbeddedComponentContainer>
        </CardContent>
      </Card>
    </div>
  );
}

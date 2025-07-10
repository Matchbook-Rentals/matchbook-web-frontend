'use client';

import React from 'react';
import { ConnectPayouts } from '@stripe/react-connect-js';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {  Wallet, Clock, CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

// Mock data for payout dashboard
const mockPayoutStats = {
  availableBalance: '$2,847',
  pendingPayouts: '$1,250',
  completedPayouts: '$45,680',
  nextPayout: 'Tomorrow',
};

export default function PayoutsPage() {
  const { user } = useUser();
  const [accountReady, setAccountReady] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      const timer = setTimeout(() => setAccountReady(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
      </div>

      {/* Payout Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockPayoutStats.availableBalance}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for payout
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mockPayoutStats.pendingPayouts}
            </div>
            <p className="text-xs text-muted-foreground">
              Processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPayoutStats.completedPayouts}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPayoutStats.nextPayout}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Component */}
      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          <EmbeddedComponentContainer 
            componentName="ConnectPayouts"
            onAccountCreated={() => setAccountReady(true)}
          >
            {!accountReady ? (
              <div className="flex items-center justify-center gap-1 py-16 text-center">
                <span className="text-lg font-medium">Loading payout data...</span>
              </div>
            ) : (
              <ConnectPayouts />
            )}
          </EmbeddedComponentContainer>
        </CardContent>
      </Card>
    </div>
  );
}

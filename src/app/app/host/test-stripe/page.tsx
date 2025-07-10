'use client';

import React from 'react';
import { ConnectPayments, ConnectPayouts } from '@stripe/react-connect-js';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestStripePage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Test Stripe Components</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Payments Test</CardTitle>
        </CardHeader>
        <CardContent>
          <EmbeddedComponentContainer componentName="ConnectPayments">
            <ConnectPayments />
          </EmbeddedComponentContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payouts Test</CardTitle>
        </CardHeader>
        <CardContent>
          <EmbeddedComponentContainer componentName="ConnectPayouts">
            <ConnectPayouts />
          </EmbeddedComponentContainer>
        </CardContent>
      </Card>
    </div>
  );
}
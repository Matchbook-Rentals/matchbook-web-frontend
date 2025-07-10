'use client';

import React from 'react';
import { 
  ConnectAccountManagement, 
  ConnectNotificationBanner
} from '@stripe/react-connect-js';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@clerk/nextjs';

export default function StripeAccountSettingsPage() {
  const { user } = useUser();
  const [accountReady, setAccountReady] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      const timer = setTimeout(() => setAccountReady(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const LoadingComponent = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center gap-1 py-16 text-center">
      <span className="text-lg font-medium">{message}</span>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your payment account settings and compliance
          </p>
        </div>
      </div>

      {/* Notification Banner */}
      <Card>
        <CardContent className="p-0">
          <EmbeddedComponentContainer 
            componentName="ConnectNotificationBanner"
            onAccountCreated={() => setAccountReady(true)}
          >
            {!accountReady ? (
              <LoadingComponent message="Loading notifications..." />
            ) : (
              <ConnectNotificationBanner />
            )}
          </EmbeddedComponentContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
            </CardHeader>
            <CardContent>
              <EmbeddedComponentContainer 
                componentName="ConnectAccountManagement"
                onAccountCreated={() => setAccountReady(true)}
              >
                {!accountReady ? (
                  <LoadingComponent message="Loading account settings..." />
                ) : (
                  <ConnectAccountManagement />
                )}
              </EmbeddedComponentContainer>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Account Status</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your account verification status and any pending requirements.
                  </p>
                  <EmbeddedComponentContainer 
                    componentName="ConnectNotificationBanner"
                    onAccountCreated={() => setAccountReady(true)}
                  >
                    {!accountReady ? (
                      <LoadingComponent message="Loading compliance status..." />
                    ) : (
                      <ConnectNotificationBanner />
                    )}
                  </EmbeddedComponentContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

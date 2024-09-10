'use client'
import React, { useState } from "react";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { ConnectAccountOnboarding, ConnectComponentsProvider } from "@stripe/react-connect-js";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User } from "@prisma/client";

export default function OnboardingClientSide(user: User) {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState(user.stripeAccountId || "");
  const [accountType, setAccountType] = useState("individual");
  const stripeConnectInstance = useStripeConnect(connectedAccountId);

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Rocket Rides</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          {!connectedAccountId && <CardTitle>Get ready for take off</CardTitle>}
          {connectedAccountId && !stripeConnectInstance && <CardTitle>Add information to start accepting money</CardTitle>}
          {!connectedAccountId && <CardDescription>Rocket Rides is the world's leading air travel platform: join our team of pilots to help people travel faster.</CardDescription>}
        </CardHeader>
        <CardContent>
          {!accountCreatePending && !connectedAccountId && (
            <>
              <RadioGroup
                value={accountType}
                onValueChange={setAccountType}
                className="mb-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="business" id="business" />
                  <Label htmlFor="business">Business</Label>
                </div>
              </RadioGroup>
              <Button
                onClick={async () => {
                  setAccountCreatePending(true);
                  setError(false);
                  fetch("/api/payment/account", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ accountType }),
                  })
                    .then((response) => response.json())
                    .then((json) => {
                      setAccountCreatePending(false);
                      const { account, error } = json;

                      if (account) {
                        setConnectedAccountId(account);
                      }

                      if (error) {
                        setError(true);
                      }
                    });
                }}
              >
                Sign up
              </Button>
            </>
          )}
          {stripeConnectInstance && (
            <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
              <ConnectAccountOnboarding
                onExit={() => setOnboardingExited(true)}
              />
            </ConnectComponentsProvider>
          )}
          {error && (
            <Card variant="destructive" className="mt-4">
              <CardContent>
                <CardDescription>Something went wrong!</CardDescription>
              </CardContent>
            </Card>
          )}
          {(connectedAccountId || accountCreatePending || onboardingExited) && (
            <Card className="mt-4">
              <CardContent>
                {connectedAccountId && <p>Your connected account ID is: <code className="font-bold">{connectedAccountId}</code></p>}
                {accountCreatePending && <p>Creating a connected account...</p>}
                {onboardingExited && <p>The Account Onboarding component has exited</p>}
              </CardContent>
            </Card>
          )}
          <Card className="mt-4">
            <CardContent>
              This is a sample app for Connect onboarding using the Account Onboarding embedded component. <a href="https://docs.stripe.com/connect/onboarding/quickstart?connect-onboarding-surface=embedded" target="_blank" rel="noopener noreferrer" className="underline">View docs</a>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
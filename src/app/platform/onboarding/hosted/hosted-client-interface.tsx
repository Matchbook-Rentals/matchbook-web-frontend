'use client'
import React, { useState } from "react";
import { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function HostedClientInterface({ user }: { user: User }) {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState(user.stripeAccountId || "");
  const [accountType, setAccountType] = useState("individual");

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
          {connectedAccountId && <CardTitle>Add information to start accepting money</CardTitle>}
          {!connectedAccountId && (
            <CardDescription>
              Rocket Rides is the world's leading air travel platform: join our team of pilots to help people travel faster.
            </CardDescription>
          )}
          {connectedAccountId && (
            <CardDescription>
              Matt's Mats partners with Stripe to help you receive payments while keeping your personal and bank details secure.
            </CardDescription>
          )}
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
                  <RadioGroupItem value="company" id="business" />
                  <Label htmlFor="business">Business</Label>
                </div>
              </RadioGroup>
              <Button
                onClick={async () => {
                  setAccountCreatePending(true);
                  setError(false);
                  fetch("/api/payment/account-create", {
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
                Create an account!
              </Button>
            </>
          )}
          {connectedAccountId && !accountLinkCreatePending && (
            <Button
              onClick={async () => {
                setAccountLinkCreatePending(true);
                setError(false);
                fetch("/api/payment/account-link", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    account: connectedAccountId,
                  }),
                })
                  .then((response) => response.json())
                  .then((json) => {
                    setAccountLinkCreatePending(false);
                    const { url, error } = json;
                    if (url) {
                      window.location.href = url;
                    }
                    if (error) {
                      setError(true);
                    }
                  });
              }}
            >
              Add information
            </Button>
          )}
          {error && (
            <Card variant="destructive" className="mt-4">
              <CardContent>
                <CardDescription>Something went wrong!</CardDescription>
              </CardContent>
            </Card>
          )}
          {(connectedAccountId || accountCreatePending || accountLinkCreatePending) && (
            <Card className="mt-4">
              <CardContent>
                {connectedAccountId && <p>Your connected account ID is: <code className="font-bold">{connectedAccountId}</code></p>}
                {accountCreatePending && <p>Creating a connected account...</p>}
                {accountLinkCreatePending && <p>Creating a new Account Link...</p>}
              </CardContent>
            </Card>
          )}
          <Card className="mt-4">
            <CardContent>
              This is a sample app for Stripe - hosted Connect onboarding. <a href="https://docs.stripe.com/connect/onboarding/quickstart?connect-onboarding-surface=hosted" target="_blank" rel="noopener noreferrer" className="underline">View docs</a>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
'use client'
import React, { useState } from "react";
import { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
mport { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HostedClientInterface(user: User) {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState();

  // ... existing handleCreateAccount and handleAddInformation functions ...

  return (
    <Card className= "w-full max-w-md mx-auto" >
    <CardHeader>
    <CardTitle>Rocket Rides </CardTitle>
      <CardDescription>
  {
    !connectedAccountId
      ? "Get ready for take off"
      : "Add information to start accepting money"
  }
  </CardDescription>
    </CardHeader>
    < CardContent >
    <p className="mb-4" >
      {!connectedAccountId
        ? "Rocket Rides is the world's leading air travel platform: join our team of pilots to help people travel faster."
        : "Matt's Mats partners with Stripe to help you receive payments while keeping your personal and bank details secure."
}
</p>

{
  !accountCreatePending && !connectedAccountId && (
    <Button onClick={ handleCreateAccount }> Create an account! </Button>
        )
}

{
  connectedAccountId && !accountLinkCreatePending && (
    <Button onClick={ handleAddInformation }> Add information </Button>
        )
}

{
  error && (
    <Alert variant="destructive" className = "mt-4" >
      <AlertDescription>Something went wrong! </AlertDescription>
        </Alert>
        )
}

{
  (connectedAccountId || accountCreatePending || accountLinkCreatePending) && (
    <Alert className="mt-4" >
      <AlertDescription>
      { connectedAccountId && (
        <p>Your connected account ID is: <code className="font-bold" > { connectedAccountId } < /code></p >
              )
}
{ accountCreatePending && <p>Creating a connected account...</p> }
{ accountLinkCreatePending && <p>Creating a new Account Link...</p> }
</AlertDescription>
  </Alert>
        )}

<Alert className="mt-4" >
  <AlertDescription>
  This is a sample app for Stripe - hosted Connect onboarding.{ " " }
<a
              href="https://docs.stripe.com/connect/onboarding/quickstart?connect-onboarding-surface=hosted"
target = "_blank"
rel = "noopener noreferrer"
className = "underline"
  >
  View docs
    </a>
    </AlertDescription>
    </Alert>
    </CardContent>
    </Card>
  );
}
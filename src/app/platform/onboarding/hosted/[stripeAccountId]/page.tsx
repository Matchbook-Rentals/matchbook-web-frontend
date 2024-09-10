import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PageProps {
  params: {
    stripeAccountId: string;
  };
}

const StripeAccountPage: FC<PageProps> = ({ params }) => {
  const { stripeAccountId } = params;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rocket Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-2xl font-bold mb-2">Details submitted</h2>
          <p className="text-gray-600">That's everything we need for now</p>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          This is a sample app for Stripe-hosted Connect onboarding.{' '}
          <a
            href="https://docs.stripe.com/connect/onboarding/quickstart?connect-onboarding-surface=hosted"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 hover:text-blue-800"
          >
            View docs
          </a>
        </AlertDescription>
      </Alert>

      <Card className="mt-6">
        <CardContent>
          <h1 className="text-xl font-semibold">Stripe Account Id: {stripeAccountId}</h1>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeAccountPage;
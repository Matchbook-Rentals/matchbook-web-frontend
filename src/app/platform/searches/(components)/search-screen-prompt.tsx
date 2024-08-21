import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import StripeCheckoutButton from "@/components/stripe/stripe-checkout-button";

interface SearchScreenPromptProps {
  isScreened: boolean;
}

export function SearchScreenPrompt({ isScreened }: SearchScreenPromptProps) {
  if (isScreened) {
    return (
      <Card className="w-[300px] text-center">
        <CardContent className="pt-6">
          <Check className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-2 text-lg font-semibold">All Good!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[450px] text-center">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          Become a Matchbook Verified Guest
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Set yourself apart
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
            <span>
              <strong>One</strong> Screening | <strong>Unlimited</strong>{" "}
              Applications
            </span>
          </li>
          <li className="flex items-center">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
            <span>
              Valid for up to <strong>Six Months</strong>
            </span>
          </li>
          <li className="flex items-center">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
            <span>
              Only <strong>$10.99</strong>
            </span>
          </li>
        </ul>
        <StripeCheckoutButton endpointUrl="/api/create-checkout-session" />
      </CardContent>
    </Card>
  );
}
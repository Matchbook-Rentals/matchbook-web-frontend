'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { SupportDialog } from '@/components/ui/support-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function StripeConnectOnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(true);
  const [hasStripeAccount, setHasStripeAccount] = React.useState(false);
  const [stripeAccountId, setStripeAccountId] = React.useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = React.useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = React.useState(false);
  const [accountType, setAccountType] = React.useState('individual');

  React.useEffect(() => {
    if (user) {
      // Check if user has already completed onboarding
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/stripe-account');
      const data = await response.json();
      
      if (data.stripeAccountId) {
        setHasStripeAccount(true);
        setStripeAccountId(data.stripeAccountId);
        
        if (data.onboardingComplete) {
          setIsOnboardingComplete(true);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleCreateAndRedirect = async () => {
    setIsLoading(true);
    try {
      // Step 1: Create Stripe account if needed
      let accountId = stripeAccountId;
      
      if (!accountId) {
        const createResponse = await fetch('/api/payment/account-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountType }),
        });
        
        const createData = await createResponse.json();
        if (createData.error) {
          console.error('Error creating Stripe account:', createData.error);
          setIsLoading(false);
          return;
        }
        accountId = createData.account;
      }
      
      // Step 2: Create account link and redirect
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      const from = searchParams.get('from');
      
      // Set up callback URLs
      const callbackUrl = new URL('/stripe-callback', window.location.origin);
      callbackUrl.searchParams.set('redirect_to', from || '/app/host/dashboard/overview');
      callbackUrl.searchParams.set('account_id', accountId);
      
      const refreshUrl = new URL('/stripe-callback', window.location.origin);
      refreshUrl.searchParams.set('redirect_to', from || '/app/host/dashboard/overview');
      refreshUrl.searchParams.set('account_id', accountId);
      
      // Create account link
      const linkResponse = await fetch('/api/payment/account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          account: accountId,
          returnUrl: callbackUrl.toString(),
          refreshUrl: refreshUrl.toString()
        }),
      });
      
      const linkData = await linkResponse.json();
      if (linkData.url) {
        // Redirect to Stripe's hosted onboarding
        window.location.href = linkData.url;
      } else {
        console.error('Error creating account link:', linkData.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error setting up Stripe payments:', error);
      setIsLoading(false);
    }
  };

  if (isOnboardingComplete) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Onboarding Complete!</h1>
              <p className="text-muted-foreground mb-6">
                Your payment account is now set up and ready to receive payments.
              </p>
              <Button onClick={() => {
                const from = searchParams.get('from');
                if (from) {
                  router.push(decodeURIComponent(from));
                } else {
                  router.push('/app/host/dashboard/overview');
                }
              }}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Account Setup</h1>
          <p className="text-muted-foreground">
            Complete your account setup to start receiving payments from tenants
          </p>
        </div>
      </div>

      {/* Onboarding Component */}
      <Card>
        <CardContent className="p-6">
          {isCheckingStatus ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#3c8787]" />
                <p>Checking your account status...</p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Set up your payment account</h2>
              <p className="text-gray-600 mb-6">
                Set up your account to receive payments from tenants securely.
              </p>

              {!hasStripeAccount && !isLoading && (
                <>
                  <RadioGroup
                    value={accountType}
                    onValueChange={setAccountType}
                    className="mb-6 flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem 
                        value="individual" 
                        id="individual"
                        className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0"
                      />
                      <Label 
                        htmlFor="individual"
                        className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                      >
                        Individual
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem 
                        value="company" 
                        id="business"
                        className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0"
                      />
                      <Label 
                        htmlFor="business"
                        className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                      >
                        Business
                      </Label>
                    </div>
                  </RadioGroup>

                  <BrandButton 
                    onClick={handleCreateAndRedirect} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    Create Payment Account
                  </BrandButton>
                </>
              )}

              {hasStripeAccount && !isLoading && (
                <BrandButton 
                  onClick={handleCreateAndRedirect} 
                  className="w-full"
                  disabled={isLoading}
                >
                  Continue Setup
                </BrandButton>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#3c8787]" />
                    <p>Redirecting to Stripe...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium mb-1">Need Help?</h4>
              <p className="text-sm text-muted-foreground">
                This process is powered by Stripe. If you have questions or encounter any issues, please contact our{' '}
                <span 
                  className="font-semibold text-secondaryBrand hover:underline cursor-pointer"
                  onClick={() => setSupportDialogOpen(true)}
                >
                  support team
                </span>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Support Dialog */}
      <SupportDialog 
        open={supportDialogOpen} 
        onOpenChange={setSupportDialogOpen} 
      />
    </div>
  );
}

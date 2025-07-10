'use client';

import React from 'react';
import { ConnectAccountOnboarding } from '@stripe/react-connect-js';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {  CheckCircle, AlertCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'account-creation',
    title: 'Create Payment Account',
    description: 'Set up your Stripe Connect account to receive payments',
    completed: false,
  },
  {
    id: 'identity-verification',
    title: 'Verify Your Identity',
    description: 'Provide required documents and information',
    completed: false,
  },
  {
    id: 'bank-details',
    title: 'Add Bank Account',
    description: 'Connect your bank account for payouts',
    completed: false,
  },
  {
    id: 'review',
    title: 'Review & Activate',
    description: 'Review your information and activate your account',
    completed: false,
  },
];

export default function StripeConnectOnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountReady, setAccountReady] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = React.useState(false);

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
      
      if (data.stripeAccountId && data.onboardingComplete) {
        setIsOnboardingComplete(true);
      } else if (data.stripeAccountId) {
        setAccountReady(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleOnboardingComplete = () => {
    setIsOnboardingComplete(true);
    // Redirect based on 'from' query param or default to host dashboard listings
    setTimeout(() => {
      const from = searchParams.get('from');
      if (from) {
        router.push(decodeURIComponent(from));
      } else {
        router.push('/app/host/dashboard/listings');
      }
    }, 2000);
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
                  router.push('/app/host/dashboard/listings');
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

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {onboardingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-100 text-green-600' 
                    : index === currentStep
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    step.completed ? 'text-green-600' : 'text-foreground'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Component */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Account Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <EmbeddedComponentContainer 
            componentName="ConnectAccountOnboarding"
            onAccountCreated={(accountId) => {
              setAccountReady(true);
              setCurrentStep(1);
            }}
          >
            {!accountReady ? (
              <div className="flex items-center justify-center gap-1 py-16 text-center">
                <span className="text-lg font-medium">Initializing onboarding...</span>
              </div>
            ) : (
              <ConnectAccountOnboarding 
                onExit={handleOnboardingComplete}
              />
            )}
          </EmbeddedComponentContainer>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Need Help?</h4>
              <p className="text-sm text-muted-foreground">
                This process is secure and powered by Stripe. Your information is encrypted and 
                protected according to industry standards. If you have questions, contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

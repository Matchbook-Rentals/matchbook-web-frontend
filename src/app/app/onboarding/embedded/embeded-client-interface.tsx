'use client';

import { ConnectAccountOnboarding } from '@stripe/react-connect-js';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import React from 'react';

export default function OnboardingClientSide() {
  return (
    <EmbeddedComponentContainer componentName="AccountOnboarding">
      <ConnectAccountOnboarding
        onExit={(e) => {
          console.log('Onboarding completed:', e);
          // Redirect back to the application page that needs Stripe setup
          if (e?.reason === 'stripe_connected') {
            // Account successfully connected
            window.location.href = '/app/host/dashboard?onboarding=complete';
          } else {
            // User exited without completing
            window.location.href = '/app/host/dashboard?onboarding=cancelled';
          }
        }}
      />
    </EmbeddedComponentContainer>
  );
}
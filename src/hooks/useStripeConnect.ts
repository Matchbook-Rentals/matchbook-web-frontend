import { useEffect, useMemo, useState, useCallback } from 'react';
import { type StripeConnectInstance } from '@stripe/connect-js';
import { loadConnectAndInitialize } from '@stripe/connect-js';

interface UseStripeConnectOptions {
  locale?: string;
  theme?: 'light' | 'dark';
  overlay?: 'dialog' | 'drawer';
}

export const useStripeConnect = (
  connectedAccountId: string,
  options: UseStripeConnectOptions = {}
) => {
  const [hasError, setHasError] = useState(false);
  const [stripeConnectInstance, setStripeConnectInstance] =
    useState<StripeConnectInstance | null>(null);

  const {
    locale = 'en-US',
    theme = 'light',
    overlay = 'dialog'
  } = options;

  const fetchClientSecret = useCallback(async () => {
    if (!connectedAccountId) {
      setHasError(true);
      return undefined;
    }

    try {
      const response = await fetch('/api/payment/account-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: connectedAccountId,
          locale,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        console.warn('An error occurred: ', error);
        setHasError(true);
        return undefined;
      }

      const { client_secret: clientSecret } = await response.json();
      setHasError(false);
      return clientSecret;
    } catch (error) {
      console.error('Failed to fetch client secret:', error);
      setHasError(true);
      return undefined;
    }
  }, [connectedAccountId, locale]);

  const appearanceVariables = useMemo(() => {
    if (theme === 'dark') {
      return {
        colorPrimary: '#3c8787', // secondaryBrand color
        colorBackground: '#0A0E27',
        colorText: '#FFFFFF',
        colorDanger: '#DF1B41',
        fontFamily: 'Poppins, system-ui, sans-serif',
        spacingUnit: '2px',
        borderRadius: '8px',
      };
    }
    return {
      colorPrimary: '#3c8787', // secondaryBrand color
      colorBackground: '#FFFFFF',
      colorText: '#344054',
      colorDanger: '#DF1B41',
      fontFamily: 'Poppins, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '8px',
    };
  }, [theme]);

  useEffect(() => {
    if (!connectedAccountId) {
      setStripeConnectInstance(null);
      return;
    }

    if (stripeConnectInstance) {
      stripeConnectInstance.update({
        appearance: {
          overlays: overlay,
          variables: appearanceVariables,
        },
        locale,
      });
    } else {
      const instance = loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        appearance: {
          overlays: overlay,
          variables: appearanceVariables,
        },
        locale,
        fetchClientSecret,
      });

      setStripeConnectInstance(instance);
    }
  }, [
    connectedAccountId,
    stripeConnectInstance,
    locale,
    fetchClientSecret,
    appearanceVariables,
    overlay,
  ]);

  return {
    stripeConnectInstance,
    hasError,
    isLoading: !stripeConnectInstance && !hasError && !!connectedAccountId,
  };
};

export default useStripeConnect;
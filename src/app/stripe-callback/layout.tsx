import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Completing Setup',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StripeCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

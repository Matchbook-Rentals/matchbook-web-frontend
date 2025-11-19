import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lease Configured Successfully',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LeaseSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

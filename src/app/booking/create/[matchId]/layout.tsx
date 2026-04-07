import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BookingHeader } from './components/booking-header';
import './booking-review.css';

const serializeUser = (user: any) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map((email: any) => ({
      emailAddress: email.emailAddress
    })),
    publicMetadata: user.publicMetadata
  };
};

export default async function BookingLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect('/sign-in');
  }

  const userObject = serializeUser(clerkUser);

  return (
    <div className="booking-review">
      <BookingHeader
        title="Review & Sign Lease"
        userId={clerkUser.id}
        user={userObject}
        isSignedIn={true}
      />
      {children}
    </div>
  );
}

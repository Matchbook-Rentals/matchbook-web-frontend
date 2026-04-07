import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { BookingHeader } from '@/app/booking/create/[matchId]/components/booking-header';
import { AdminBookingClient } from './admin-booking-client';
import '@/app/booking/create/[matchId]/booking-review.css';
import './newnew-overrides.css';

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

export default async function AdminBookingCreatePage({ params }: { params: { matchId: string } }) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const userObject = serializeUser(clerkUser);

  return (
    <div className="booking-review newnew-booking">
      <BookingHeader
        title="Review & Sign Lease"
        userId={clerkUser.id}
        user={userObject}
        isSignedIn={true}
      />
      <AdminBookingClient matchId={params.matchId} />
    </div>
  );
}

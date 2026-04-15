import { getMatchById } from '@/app/actions/matches';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { LeaseSigningClient } from './lease-signing-client';
import { AwaitingLeaseClient } from './awaiting-lease-client';
import { getBookingReceipt } from './get-booking-receipt';

interface LeaseSigningPageProps {
  params: { matchId: string };
}

/**
 * Determine which step of the booking flow a user should land on based on
 * the current match state. Runs server-side so the client mounts directly
 * at the correct step without any redirect/scroll flash.
 *
 * Steps (kept in sync with awaiting-lease-client.tsx STEP_LABELS):
 *   0 — Review Booking
 *   1 — Sign Lease
 *   2 — Pay and Book
 *   3 — Confirmation
 */
function computeInitialBookingStep(match: {
  tenantSignedAt: Date | null;
  paymentAuthorizedAt: Date | null;
  booking: { id: string } | null;
}): number {
  if (match.booking || match.paymentAuthorizedAt) return 3; // Confirmation
  if (match.tenantSignedAt) return 2; // Pay and Book
  return 0; // Review Booking (default entry point)
}

async function getLeaseDocument(leaseDocumentId: string | null) {
  if (!leaseDocumentId) return null;

  const document = await prisma.documentInstance.findUnique({
    where: { id: leaseDocumentId },
    include: {
      template: true,
      signingSessions: true,
      fieldValues: true,
    },
  });

  if (!document) return null;

  return {
    id: document.id,
    pdfFileUrl: document.pdfFileUrl,
    pdfFileName: document.pdfFileName,
    documentData: document.documentData as any,
    fieldValues: document.fieldValues.map(fv => ({
      fieldId: fv.fieldId,
      value: fv.value,
      signerIndex: fv.signerIndex,
      signedAt: fv.signedAt?.toISOString() ?? null,
    })),
    template: document.template,
    signingSessions: document.signingSessions,
  };
}

export default async function LeaseSigningPage({ params }: LeaseSigningPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!dbUser?.email) {
    throw new Error('User email not found');
  }

  const result = await getMatchById(params.matchId);

  if (!result.success || !result.match) {
    notFound();
  }

  const match = result.match;

  // Prefetch lease document server-side
  const leaseDocument = await getLeaseDocument(match.leaseDocumentId);

  // Build the booking receipt from real RentPayment rows when a booking exists
  // so the confirmation step can render actuals instead of client-computed estimates.
  const bookingReceipt = match.booking ? await getBookingReceipt(match.booking.id) : null;

  // TODO: temporarily always show the new booking review UI for development
  // Original condition: if (!match.leaseDocumentId)
  const initialStep = computeInitialBookingStep(match);

  return (
    <AwaitingLeaseClient
      match={match}
      matchId={params.matchId}
      isAdminDev={await checkRole('admin_dev')}
      currentUserEmail={dbUser.email}
      leaseDocument={leaseDocument}
      initialStep={initialStep}
      bookingReceipt={bookingReceipt}
    />
  );

  // Redirect if booking already created
  if (match.booking) {
    redirect(`/booking/create/${params.matchId}/complete`);
  }

  const isAdminDev = await checkRole('admin_dev');

  let serverInitialStep = 'overview-lease';
  if (match.tenantSignedAt) {
    serverInitialStep = 'complete-payment';
  }

  return (
    <LeaseSigningClient
      match={match}
      matchId={params.matchId}
      isAdminDev={isAdminDev}
      initialStep={serverInitialStep}
      currentUserEmail={dbUser.email}
    />
  );
}

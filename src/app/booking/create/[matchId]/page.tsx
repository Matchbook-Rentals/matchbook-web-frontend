import { getMatchById } from '@/app/actions/matches';
import { notFound, redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { LeaseSigningClient } from './lease-signing-client';
import { AwaitingLeaseClient } from './awaiting-lease-client';

interface LeaseSigningPageProps {
  params: { matchId: string };
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

  // TODO: temporarily always show the new booking review UI for development
  // Original condition: if (!match.leaseDocumentId)
  return (
    <AwaitingLeaseClient
      match={match}
      matchId={params.matchId}
      isAdminDev={await checkRole('admin_dev')}
      currentUserEmail={dbUser.email}
      leaseDocument={leaseDocument}
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

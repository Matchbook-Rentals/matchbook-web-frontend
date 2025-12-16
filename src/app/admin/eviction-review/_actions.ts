'use server'

import prisma from '@/lib/prismadb'
import { checkDeveloperAccess } from '@/utils/roles'
import { revalidatePath } from 'next/cache'
import { sendNotificationEmail } from '@/lib/send-notification-email'

export interface EvictionRecordInput {
  caseNumber: string
  filingDate?: string
  dispositionDate?: string
  plaintiff?: string
  defendantAddress?: string
  judgmentAmount?: number
  disposition?: string
  court?: string
  notes?: string
}

export async function getVerificationsNeedingReview() {
  if (!(await checkDeveloperAccess())) {
    throw new Error('Unauthorized')
  }

  const verifications = await prisma.verification.findMany({
    where: {
      OR: [
        { evictionReviewStatus: 'pending_review' },
        { evictionStatus: 'Records Found' },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      bgsReport: {
        select: {
          id: true,
          orderId: true,
          reportData: true,
        },
      },
      evictionRecords: true,
    },
    orderBy: {
      screeningDate: 'desc',
    },
  })

  return verifications
}

export async function getVerificationDetails(verificationId: string) {
  if (!(await checkDeveloperAccess())) {
    throw new Error('Unauthorized')
  }

  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      bgsReport: {
        select: {
          id: true,
          orderId: true,
          reportData: true,
        },
      },
      evictionRecords: {
        orderBy: { createdAt: 'desc' },
      },
      criminalRecords: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return verification
}

export async function addEvictionRecord(
  verificationId: string,
  data: EvictionRecordInput,
  adminUserId: string
) {
  if (!(await checkDeveloperAccess())) {
    throw new Error('Unauthorized')
  }

  const record = await prisma.evictionRecord.create({
    data: {
      verificationId,
      caseNumber: data.caseNumber,
      filingDate: data.filingDate ? new Date(data.filingDate) : null,
      dispositionDate: data.dispositionDate ? new Date(data.dispositionDate) : null,
      plaintiff: data.plaintiff,
      defendantAddress: data.defendantAddress,
      judgmentAmount: data.judgmentAmount,
      disposition: data.disposition,
      court: data.court,
      notes: data.notes,
      enteredBy: adminUserId,
    },
  })

  // Update eviction count
  const evictionCount = await prisma.evictionRecord.count({
    where: { verificationId },
  })

  await prisma.verification.update({
    where: { id: verificationId },
    data: { evictionCount },
  })

  revalidatePath(`/admin/eviction-review/${verificationId}`)
  revalidatePath('/admin/eviction-review')

  return record
}

export async function deleteEvictionRecord(recordId: string, verificationId: string) {
  if (!(await checkDeveloperAccess())) {
    throw new Error('Unauthorized')
  }

  await prisma.evictionRecord.delete({
    where: { id: recordId },
  })

  // Update eviction count
  const evictionCount = await prisma.evictionRecord.count({
    where: { verificationId },
  })

  await prisma.verification.update({
    where: { id: verificationId },
    data: { evictionCount },
  })

  revalidatePath(`/admin/eviction-review/${verificationId}`)
  revalidatePath('/admin/eviction-review')
}

export async function markEvictionReviewed(verificationId: string) {
  if (!(await checkDeveloperAccess())) {
    throw new Error('Unauthorized')
  }

  // Mark all eviction records as verified
  await prisma.evictionRecord.updateMany({
    where: { verificationId },
    data: { verified: true },
  })

  // Update verification status
  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      evictionReviewStatus: 'reviewed',
    },
  })

  // Send user completion email now that eviction records are verified
  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
        },
      },
    },
  })

  if (verification?.user?.email) {
    await sendNotificationEmail({
      to: verification.user.email,
      subject: 'Your MatchBook Background Check is Complete',
      emailData: {
        companyName: 'MatchBook',
        headerText: 'Background Check Complete',
        contentTitle: 'Your Verification is Ready',
        contentText: `Hi ${verification.user.firstName || 'there'}, your background check has been completed. You can now apply to rentals on MatchBook.`,
        buttonText: 'View My Verification',
        buttonUrl: 'https://matchbookrentals.com/app/rent/verification',
        companyAddress: '3024 N 1400 E',
        companyCity: 'Ogden, UT',
        companyWebsite: 'matchbookrentals.com',
      },
    })
  }

  revalidatePath(`/admin/eviction-review/${verificationId}`)
  revalidatePath('/admin/eviction-review')
}

export async function markEvictionPendingReview(verificationId: string) {
  if (!(await checkDeveloperAccess())) {
    throw new Error('Unauthorized')
  }

  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      evictionReviewStatus: 'pending_review',
    },
  })

  revalidatePath(`/admin/eviction-review/${verificationId}`)
  revalidatePath('/admin/eviction-review')
}

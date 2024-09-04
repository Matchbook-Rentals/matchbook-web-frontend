import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import StripeCheckoutButton from '@/components/stripe/stripe-checkout-button';
import { ApiRequestButtons } from './(components)/request-buttons';

async function checkBackgroundCheckPurchase(userId: string) {
  'use server';
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: userId,
      type: 'backgroundCheck',
      isRedeemed: false,
    },
  });
  return purchase !== null;
}

async function redeemBackgroundCheck(userId: string) {
  'use server';

  await prisma.purchase.updateMany({
    where: {
      userId: userId,
      type: 'backgroundCheck',
      isRedeemed: false,
    },
    data: {
      isRedeemed: true,
    },
  });

  revalidatePath('/platform/background-check');
}

export default async function BackgroundCheckPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const hasUnredeemedPurchase = await checkBackgroundCheckPurchase(userId);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1>Background Check</h1>
      {hasUnredeemedPurchase ? (
        <ApiRequestButtons />
      ) : (
        <>
          <a href="/purchase/background-check">
            <button>Pay for Background Check</button>
          </a>
          <StripeCheckoutButton endpointUrl="/api/create-checkout-session/background-check" />
        </>
      )}
    </div>
  );
}
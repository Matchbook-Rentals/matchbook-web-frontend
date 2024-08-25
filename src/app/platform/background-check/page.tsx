import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

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
    <div>
      <h1>Background Check</h1>
      {hasUnredeemedPurchase ? (
        <form action={() => redeemBackgroundCheck(userId)}>
          <button type="submit">Get Background Check</button>
        </form>
      ) : (
        <a href="/purchase/background-check">
          <button>Pay for Background Check</button>
        </a>
      )}
    </div>
  );
}
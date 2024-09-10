import { Button } from "@/components/ui/button"
import OnboardingClientSide from "./OnboardingClientSide"
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  return (
    <div className="container">
      <h1>Stripe Onboarding</h1>
      <OnboardingClientSide user={user} />
    </div>
  )
}

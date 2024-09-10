
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import HostedClientInterface from "./hosted-client-interface";

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
      <HostedClientInterface user={user} />
    </div>
  )
}

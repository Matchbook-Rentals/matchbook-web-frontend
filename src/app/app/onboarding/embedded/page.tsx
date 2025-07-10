import OnboardingClientSide from "./embeded-client-interface";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Account Setup</h1>
          <p className="text-gray-600">Complete your setup to start receiving payments from tenants</p>
        </div>
        <OnboardingClientSide />
      </div>
    </div>
  );
}

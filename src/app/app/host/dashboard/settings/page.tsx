import { currentUser } from "@clerk/nextjs/server";
import { HospitableConnect } from "./hospitable-connect";
import prisma from "@/lib/prismadb";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Fetch user from your DB to check for tokens
  const dbUser = await prisma.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress }, // or by id if you sync it
    select: { hospitableAccessToken: true },
  });

  const isConnected = !!dbUser?.hospitableAccessToken;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="p-6 border rounded-lg">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect your account to third-party services like Hospitable to sync
          your bookings.
        </p>
        <HospitableConnect isConnected={isConnected} />
      </div>
    </div>
  );
}

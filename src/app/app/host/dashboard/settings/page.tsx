import { currentUser } from "@clerk/nextjs/server";
// import { HospitableConnect } from "./hospitable-connect";
// import prisma from "@/lib/prismadb";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Fetch user from your DB to check for tokens
  // const dbUser = await prisma.user.findUnique({
  //   where: { email: user.emailAddresses[0].emailAddress }, // or by id if you sync it
  //   select: { hospitableAccessToken: true },
  // });

  // const isConnected = !!dbUser?.hospitableAccessToken;

  return (
    <div className={HOST_PAGE_STYLE}>
      {/* Replace shadow */}
      <div className="space-y-0">
        <HostPageTitle title="Settings" />
        <div className="p-6  bg-background shadow-md rounded-lg">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-gray-500 mb-4">
            Connect your account to third-party services like Hospitable to sync
            your bookings.
          </p>
          {/* <HospitableConnect isConnected={isConnected} /> */}
        </div>
      </div>
    </div>
  );
}

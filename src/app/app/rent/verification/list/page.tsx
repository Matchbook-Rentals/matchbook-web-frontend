import { APP_PAGE_MARGIN } from "@/constants/styles"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import prismadb from "@/lib/prismadb"
import { VerificationListClient } from "./verification-list-client"

export default async function VerificationListPage() {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Fetch all user's verifications (most recent first)
  const verifications = await prismadb.verification.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          imageUrl: true,
          email: true,
        },
      },
      creditReport: {
        select: {
          id: true,
          creditBucket: true,
        },
      },
      bgsReport: {
        select: {
          id: true,
          status: true,
          reportData: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Filter to only show verifications that are in progress or completed
  const displayableVerifications = verifications.filter(
    (v) => v.status === "PROCESSING_BGS" || v.status === "COMPLETED"
  )

  // If no displayable verifications, redirect to verification flow
  if (displayableVerifications.length === 0) {
    redirect("/app/rent/verification")
  }

  return (
    <div className={`min-h-screen bg-background ${APP_PAGE_MARGIN}`}>
      <main className="md:container mx-auto py-8">
        <VerificationListClient verifications={displayableVerifications} />
      </main>
    </div>
  )
}

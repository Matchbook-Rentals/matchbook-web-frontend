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

  // Fetch user's verification
  const verification = await prismadb.verification.findUnique({
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
  })

  // If no verification exists or hasn't started processing, redirect to verification flow
  // Allow PROCESSING_BGS (waiting for Accio webhook) or COMPLETED
  if (!verification || (verification.status !== "PROCESSING_BGS" && verification.status !== "COMPLETED")) {
    redirect("/app/rent/verification")
  }

  return (
    <div className={`min-h-screen bg-background ${APP_PAGE_MARGIN}`}>
      <main className="md:container mx-auto py-8">
        <VerificationListClient verification={verification} />
      </main>
    </div>
  )
}

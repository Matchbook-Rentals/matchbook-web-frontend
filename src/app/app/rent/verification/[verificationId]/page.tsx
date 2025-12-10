import { APP_PAGE_MARGIN } from "@/constants/styles"
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import prismadb from "@/lib/prismadb"
import { VerificationDetailsClient } from "./verification-details-client"

interface VerificationDetailsPageProps {
  params: { verificationId: string }
}

export default async function VerificationDetailsPage({ params }: VerificationDetailsPageProps) {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Fetch the verification by ID
  const verification = await prismadb.verification.findUnique({
    where: { id: params.verificationId },
    include: {
      user: {
        select: {
          id: true,
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

  // If not found, show 404
  if (!verification) {
    notFound()
  }

  // Only allow the owner to view their verification details
  if (verification.userId !== userId) {
    redirect("/app/rent/verification/list")
  }

  return (
    <div className={`min-h-screen bg-background ${APP_PAGE_MARGIN}`}>
      <main className="md:container mx-auto py-8">
        <VerificationDetailsClient verification={verification} />
      </main>
    </div>
  )
}

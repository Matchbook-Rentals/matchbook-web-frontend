import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import PaymentScheduleClient from "./payment-schedule-client";

export default async function PaymentSchedulePage({
  params
}: {
  params: { bookingId: string };
}) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch booking with rent payments and verify host owns it
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      rentPayments: {
        orderBy: { dueDate: 'asc' }
      },
      listing: {
        select: {
          userId: true,
          title: true,
          streetAddress1: true,
          city: true,
          state: true,
          postalCode: true
        }
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!booking || booking.listing.userId !== userId) {
    redirect("/platform/host-dashboard");
  }

  return <PaymentScheduleClient booking={booking} />;
}
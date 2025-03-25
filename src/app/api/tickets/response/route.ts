import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { checkRole } from "@/utils/roles";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    // Check if request is from an admin
    const { userId } = auth();
    if (!userId || !checkRole("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const ticketId = formData.get("ticketId") as string;
    const content = formData.get("content") as string;

    if (!ticketId || !content) {
      return NextResponse.json(
        { error: "Ticket ID and content are required" },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await prismadb.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Create the response
    const response = await prismadb.ticketResponse.create({
      data: {
        content,
        ticketId,
        isFromStaff: true,
        authorName: "Admin Support",
      },
    });

    // Update ticket status to in-progress if it's open
    if (ticket.status === "open") {
      await prismadb.ticket.update({
        where: { id: ticketId },
        data: { status: "in-progress" },
      });
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");

    return NextResponse.redirect(
      new URL(`/admin/tickets/${ticketId}`, req.url),
      { status: 303 }
    );
  } catch (error) {
    console.error("Error creating ticket response:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the response" },
      { status: 500 }
    );
  }
}
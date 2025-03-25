import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { checkRole } from "@/utils/roles";
import { revalidatePath } from "next/cache";
import nodemailer from 'nodemailer';

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

    // Update ticket status to in-progress if it's open
    if (ticket.status === "open") {
      await prismadb.ticket.update({
        where: { id: ticketId },
        data: { status: "in-progress" },
      });
    }

    // Send email response directly to the user
    const username = process.env.OUTBOUND_EMAIL_USER;
    const password = process.env.OUTBOUND_EMAIL_PASS;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: username,
        pass: password
      }
    });

    const mailOptions = {
      from: process.env.OUTBOUND_EMAIL_USER,
      to: ticket.email,
      subject: `RE: ${ticket.title} [Ticket #${ticket.id.substring(0, 8)}]`,
      text: content,
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .header { background-color: #f0f0f0; padding: 20px; text-align: center; }
              .content { padding: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${process.env.NEXT_PUBLIC_URL}/logo-nav-new.png" alt="Matchbook Logo" style="max-width: 200px;">
              <h1>Matchbook Support</h1>
            </div>
            <div class="content">
              <p>Hello ${ticket.name || ticket.email.split('@')[0]},</p>
              <div>${content.replace(/\n/g, '<br/>')}</div>
              <p>Best regards,<br>Matchbook Support Team</p>
              <hr>
              <p style="font-size: 12px; color: #666;">
                This is a response to your support ticket regarding "${ticket.title}".<br>
                Ticket ID: ${ticket.id.substring(0, 8)}
              </p>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email response sent to ${ticket.email} for ticket ${ticketId}`);

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");

    return NextResponse.redirect(
      new URL(`/admin/tickets/${ticketId}`, req.url),
      { status: 303 }
    );
  } catch (error) {
    console.error("Error sending email response:", error);
    return NextResponse.json(
      { error: "An error occurred while sending the email response" },
      { status: 500 }
    );
  }
}
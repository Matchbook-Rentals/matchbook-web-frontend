import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";

// GET - Get all tickets with pagination and filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  
  try {
    const { userId } = auth();
    
    // Check if user has admin role
    if (!checkRole('admin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [tickets, total] = await Promise.all([
      prismadb.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
          responses: {
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prismadb.ticket.count({ where }),
    ]);
    
    return NextResponse.json({
      tickets,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new ticket
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    const body = await request.json();
    
    const { title, description, email, name, category, pageUrl, userAgent } = body;
    
    // Email is always required
    if (!title || !description || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const ticket = await prismadb.ticket.create({
      data: {
        title,
        description,
        email,
        name,
        category,
        priority: "medium", // Default priority
        pageUrl,
        userAgent,
        userId: userId || undefined,
        status: "open",
      },
    });
    
    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
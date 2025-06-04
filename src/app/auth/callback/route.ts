import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  // Fetch Clerk user metadata
  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata?.role || "user";

  // Update role in database
  await prismadb.user.update({
    where: { id: userId },
    data: { role },
  });

  // Check terms agreement
  const dbUser = await prismadb.user.findUnique({ where: { id: userId } });
  const hasAgreedToTerms = dbUser?.agreedToTerms || false;

  // Redirect based on terms agreement
  if (!hasAgreedToTerms) {
    return NextResponse.redirect(new URL("/terms", process.env.NEXT_PUBLIC_URL));
  }

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_URL));
}

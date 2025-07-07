import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  // Get redirect_url from query params
  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get("redirect_url");

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
    const termsUrl = new URL("/terms", process.env.NEXT_PUBLIC_URL);
    if (redirectUrl) {
      termsUrl.searchParams.set("redirect_url", redirectUrl);
    }
    return NextResponse.redirect(termsUrl);
  }

  // User has agreed to terms, redirect to specified URL or default
  const finalRedirectUrl = redirectUrl || "/";
  return NextResponse.redirect(new URL(finalRedirectUrl, process.env.NEXT_PUBLIC_URL));
}

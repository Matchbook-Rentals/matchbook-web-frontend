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
  console.log('REDIRECT', redirectUrl)

  // Fetch Clerk user metadata
  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata?.role || "user";

  // Check terms agreement from database
  const dbUser = await prismadb.user.findUnique({ where: { id: userId } });
  const hasAgreedToTerms = dbUser?.agreedToTerms || false;

  // Update role and terms agreement status in database and user metadata
  await prismadb.user.update({
    where: { id: userId },
    data: { role },
  });

  // Update user metadata with terms agreement status for session access
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      agreedToTerms: hasAgreedToTerms,
    },
  });

  // Redirect to specified URL or default (terms checking now handled in middleware)
  const finalRedirectUrl = redirectUrl || "/";
  console.log('Final Redirect', finalRedirectUrl)
  return NextResponse.redirect(new URL(finalRedirectUrl, process.env.NEXT_PUBLIC_URL));
}

import { NextResponse } from "next/server";
import { getISoftPullUrl, getAccioUrl, hasISoftPullKeys, hasAccioKeys } from "@/lib/verification/config";

export async function GET() {
  const isDev = process.env.NODE_ENV === "development";

  return NextResponse.json({
    status: "ok",
    environment: isDev ? "development" : "production",
    timestamp: new Date().toISOString(),

    // URLs that will be used
    urls: {
      isoftpull: getISoftPullUrl(),
      accio: getAccioUrl(),
    },

    // Env vars configured (not values, just presence)
    credentials: {
      isoftpull: hasISoftPullKeys(),
      accio: hasAccioKeys(),
      stripe: !!process.env.STRIPE_SECRET_KEY,
      stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "live" : "test",
    },

    // Webhook config
    webhook: {
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://matchbookrentals.com",
      endpoint: "/api/background-check-webhook",
    },
  });
}

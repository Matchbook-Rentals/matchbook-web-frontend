import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Matchbook Rentals | Coming Soon",
  description: "Your place, all in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="custom-scrollbar w-[100%] max-w-[100%]">
        <body className={lora.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}

//ClerkProvider may need to be moved to a (app) or (platform) route group to allow for SSR.
